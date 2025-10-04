import { Service, TypedEvent } from '@pulse-ts/core';
import type { World } from '@pulse-ts/core';
import type {
    ActionState,
    InputOptions,
    InputProvider,
    PointerSnapshot,
    Vec,
    ExprBindings,
} from '../bindings/types';
import { BindingRegistry } from '../bindings/registry';
import { computeActionState } from './internal/state';
import { advanceSequencesForKey } from './internal/sequence';
import { accumulatePointerDelta } from './internal/pointer';
import { composeVec2From1D } from './internal/axes';
import { computeChordDownActions } from './internal/chords';

/**
 * World-scoped input service: collects device events, applies bindings,
 * and exposes stable per-frame snapshots.
 *
 * @example
 * ```ts
 * import { World } from '@pulse-ts/core';
 * import { InputService } from '@pulse-ts/input';
 * const world = new World();
 * const svc = world.provideService(new InputService({ preventDefault: true }));
 * svc.setBindings({ jump: { type: 'key', code: 'Space' } });
 * svc.handleKey('Space', true);
 * svc.commit();
 * console.log(svc.action('jump').pressed); // true
 * ```
 */
export class InputService extends Service {
    //#region Fields

    readonly options: Readonly<InputOptions>;

    private providers: InputProvider[] = [];
    private bindings = new BindingRegistry();

    // per-action active sources for digital actions (e.g., KeyW, Mouse0)
    private digitalSources = new Map<string, Set<string>>();
    // per-action 1D snapshots
    private actions = new Map<string, ActionState>();

    // per-action accumulated vec2 deltas for this frame
    private vec2Accum = new Map<string, Vec>();
    // per-action vec2 snapshot (frame)
    private vec2State = new Map<string, Vec>();
    // per-action accumulated 1D axis values for this frame (virtual/manual)
    private axis1Accum = new Map<string, number>();
    private axis1PrevInjected = new Set<string>();
    // key state (down) for Axis1DKeys support
    private keysDown = new Set<string>();
    // sequence runtime state and pulses
    private seqState = new Map<string, { index: number; lastFrame: number }>();
    private seqPulse = new Set<string>();

    // pointer state + accumulators
    private pointer: PointerSnapshot = {
        x: 0,
        y: 0,
        deltaX: 0,
        deltaY: 0,
        wheelX: 0,
        wheelY: 0,
        wheelZ: 0,
        buttons: 0,
        locked: false,
    };
    private pDelta = { dx: 0, dy: 0 };
    private pWheel = { x: 0, y: 0, z: 0 };

    // events for consumers who prefer subscriptions
    /**
     * Event fired when an action changes its pressed/released state during commit.
     * Useful for event-driven input handling.
     *
     * @example
     * ```ts
     * const svc = new InputService();
     * svc.setBindings({ jump: { type: 'key', code: 'Space' } });
     * const off = svc.actionEvent.on(({ name, state }) => {
     *   if (name === 'jump' && state.pressed) console.log('JUMP!');
     * });
     * // later: off();
     * ```
     */
    readonly actionEvent = new TypedEvent<{
        name: string;
        state: ActionState;
    }>();

    //#endregion

    constructor(opts: InputOptions = {}) {
        super();
        this.options = Object.freeze({ ...opts });
    }

    //#region Lifecycle Methods

    /**
     * Attach the service to a world.
     * @param world The world to attach to.
     */
    attach(world: World): void {
        super.attach(world);
        const target = this.getTarget();
        if (target) for (const p of this.providers) p.start(target);
    }

    /**
     * Detach the service from a world.
     */
    detach(): void {
        for (const p of this.providers) p.stop();
        super.detach();
    }

    //#endregion

    //#region Public Methods

    /**
     * Register an input provider.
     * @param p Provider implementing `InputProvider`.
     */
    registerProvider(p: InputProvider): void {
        this.providers.push(p);
        const target = this.getTarget();
        if (target && this.world) p.start(target);
    }

    /**
     * Unregister a previously registered input provider.
     * If attached, the provider is stopped and removed.
     * @param p Provider instance to remove.
     *
     * @example
     * ```ts
     * const kbd = new DOMKeyboardProvider(svc);
     * svc.registerProvider(kbd);
     * // later
     * svc.unregisterProvider(kbd);
     * ```
     */
    unregisterProvider(p: InputProvider): void {
        const idx = this.providers.indexOf(p);
        if (idx >= 0) {
            try {
                if (this.world) p.stop();
            } finally {
                this.providers.splice(idx, 1);
            }
        }
    }

    /**
     * Replace existing bindings with the given expressions.
     * @param b Map of action name to binding expression (or array).
     */
    setBindings(b: ExprBindings): void {
        this.bindings.setBindings(b);
    }

    /**
     * Merge (append/override) bindings into the current mapping.
     * @param b Partial bindings to merge.
     */
    mergeBindings(b: ExprBindings): void {
        this.bindings.mergeBindings(b);
    }

    /**
     * Handle a keyboard event.
     * @param code KeyboardEvent.code (e.g., `KeyW`, `Space`).
     * @param down True on keydown, false on keyup.
     */
    handleKey(code: string, down: boolean): void {
        const actions = this.bindings.getActionsForKey(code);
        for (const name of actions)
            this.setDigitalSource(name, `key:${code}`, down);
        // Track raw key state for axes1DKeys
        if (down) {
            this.keysDown.add(code);
            const frameId = (this.world as any)?.getFrameId?.() ?? 0;
            const pulses = advanceSequencesForKey(
                code,
                frameId,
                this.bindings.getSequences(),
                this.seqState,
            );
            for (const a of pulses) this.seqPulse.add(a);
        } else {
            this.keysDown.delete(code);
        }
    }

    /**
     * Handle a pointer button event.
     * @param button Button index (0,1,2,...).
     * @param down True on down, false on up.
     */
    handlePointerButton(button: number, down: boolean): void {
        const actions = this.bindings.getActionsForButton(button);
        for (const name of actions)
            this.setDigitalSource(name, `btn:${button}`, down);
    }

    /**
     * Handle a pointer movement.
     * @param x Client X.
     * @param y Client Y.
     * @param dx Delta X (movementX preferred when locked).
     * @param dy Delta Y (movementY preferred when locked).
     * @param locked Whether pointer lock is active.
     * @param buttons Bitmask of currently held buttons.
     */
    handlePointerMove(
        x: number,
        y: number,
        dx: number,
        dy: number,
        locked: boolean,
        buttons: number,
    ): void {
        this.pointer.x = x;
        this.pointer.y = y;
        this.pointer.locked = !!locked;
        this.pointer.buttons = buttons >>> 0;
        this.pDelta.dx += dx;
        this.pDelta.dy += dy;
        for (const action of this.bindings.getPointerMoveActions()) {
            const mod = this.bindings.getPointerVec2Modifiers(action);
            accumulatePointerDelta(action, dx, dy, mod, this.vec2Accum);
        }
    }

    /**
     * Handle a wheel delta.
     * @param dx Wheel X delta.
     * @param dy Wheel Y delta.
     * @param dz Wheel Z delta.
     */
    handleWheel(dx: number, dy: number, dz: number): void {
        this.pWheel.x += dx;
        this.pWheel.y += dy;
        this.pWheel.z += dz;
    }

    /**
     * Inject a digital action (virtual/testing input). Adds/removes a source id.
     * @param action Action name.
     * @param sourceId Stable source id (e.g., `virt:bot1`).
     * @param down True to press, false to release.
     */
    injectDigital(action: string, sourceId: string, down: boolean): void {
        this.setDigitalSource(action, sourceId, down);
    }

    /**
     * Inject an Axis2D per-frame delta (virtual/testing input).
     * @param action Axis2D action name.
     * @param axes Object with numeric components to accumulate this frame.
     */
    injectAxis2D(action: string, axes: Vec): void {
        const a = this.vec2Accum.get(action) ?? { x: 0, y: 0 };
        Object.entries(axes).forEach(([key, value]) => {
            a[key] = (a[key] ?? 0) + value;
        });
        this.vec2Accum.set(action, a);
    }

    /**
     * Inject a 1D axis value for this frame (virtual/testing input).
     * Subsequent calls in the same frame accumulate.
     * @param action Axis name.
     * @param value Numeric value to add for this frame.
     */
    injectAxis1D(action: string, value: number): void {
        const prev = this.axis1Accum.get(action) ?? 0;
        this.axis1Accum.set(action, prev + value);
    }

    /**
     * Commit provider updates and compute per-frame snapshots.
     * Call once per frame (done automatically by `InputCommitSystem`).
     */
    commit(): void {
        // allow providers to poll
        for (const p of this.providers) p.update?.();

        const frameId = (this.world as any)?.getFrameId?.() ?? 0;

        this.commitChordStates();
        this.commitSequencePulses();
        this.commitDigitalActions(frameId);
        this.commitAxes1DFromKeys(frameId);
        this.commitPointerVec2();
        this.commitWheel(frameId);
        this.commitPointerSnapshot();
        this.commitInjectedAxes1D(frameId);
        this.commitDerivedVec2();
        this.finalizeSequences();
    }

    /**
     * Get current `ActionState` for an action.
     * @param name Action name.
     * @returns The current state (default zeros if unknown).
     */
    action(name: string): ActionState {
        return (
            this.actions.get(name) ?? {
                down: false,
                pressed: false,
                released: false,
                value: 0,
                since: (this.world as any)?.getFrameId?.() ?? 0,
            }
        );
    }

    /**
     * Get numeric axis value.
     * @param name Axis name.
     * @returns Axis numeric value.
     */
    axis(name: string): number {
        return this.action(name).value;
    }

    /**
     * Get 2D axis value object.
     * @param name Axis2D name.
     * @returns Record with axis component values.
     */
    vec2(name: string): Vec {
        const v = this.vec2State.get(name);
        if (v) return v;
        // Default zero object based on known axis 2D definition or pointer action
        for (const [n, def] of this.bindings.getVec2Defs()) {
            if (n === name) {
                const obj: Vec = {};
                obj[def.key1] = 0;
                obj[def.key2] = 0;
                return obj;
            }
        }
        const pActions2 = this.bindings.getPointerMoveActions();
        if (pActions2.includes(name)) return { x: 0, y: 0 };
        return { x: 0, y: 0 };
    }

    /**
     * Get the pointer snapshot for this frame.
     * @returns Pointer snapshot.
     */
    pointerState(): PointerSnapshot {
        return this.pointer;
    }

    //#endregion

    //#region Private Methods

    // computeActionState moved to internal helper for clarity

    /**
     * Get the target.
     * @returns The target.
     */
    private getTarget(): EventTarget | null | undefined {
        if ('target' in this.options) return this.options.target;
        // Default to window if present
        return typeof window !== 'undefined'
            ? (window as unknown as EventTarget)
            : null;
    }

    /**
     * Set the digital source.
     * @param name The name of the digital source.
     * @param sourceId The source ID.
     * @param down Whether the source is down.
     */
    private setDigitalSource(
        name: string,
        sourceId: string,
        down: boolean,
    ): void {
        const set = this.digitalSources.get(name) ?? new Set<string>();
        if (down) set.add(sourceId);
        else set.delete(sourceId);
        this.digitalSources.set(name, set);
    }

    // Sequence advancement moved to internal helper

    //#endregion

    //#region Commit helpers

    private commitChordStates(): void {
        const chordDown = computeChordDownActions(
            this.keysDown,
            this.bindings.getChords(),
        );
        for (const [action] of this.bindings.getChords())
            this.setDigitalSource(action, 'chord', chordDown.has(action));
    }

    private commitSequencePulses(): void {
        for (const action of this.seqPulse)
            this.setDigitalSource(action, 'seq', true);
    }

    private commitDigitalActions(frameId: number): void {
        for (const [name, sources] of this.digitalSources.entries()) {
            const nextValue = sources.size > 0 ? 1 : 0;
            const prev = this.actions.get(name);
            const state = computeActionState(prev, nextValue, frameId);
            this.actions.set(name, state);
            if (state.pressed || state.released)
                this.actionEvent.emit({ name, state });
        }
    }

    private commitAxes1DFromKeys(frameId: number): void {
        for (const [name, def] of this.bindings.getAxes1DKeys()) {
            const posActive = def.pos.some((c) => this.keysDown.has(c));
            const negActive = def.neg.some((c) => this.keysDown.has(c));
            let nextValue = (posActive ? 1 : 0) - (negActive ? 1 : 0);
            nextValue *= def.scale;
            const prev = this.actions.get(name);
            const state = computeActionState(prev, nextValue, frameId);
            this.actions.set(name, state);
            if (state.pressed || state.released)
                this.actionEvent.emit({ name, state });
        }
    }

    private commitPointerVec2(): void {
        const pActions = this.bindings.getPointerMoveActions();
        for (const name of pActions) this.vec2State.set(name, { x: 0, y: 0 });
        for (const [name, v] of this.vec2Accum)
            this.vec2State.set(name, { ...v });
        this.vec2Accum.clear();
    }

    private commitWheel(frameId: number): void {
        for (const [name, def] of this.bindings.getWheelBindings()) {
            const nextValue = this.pWheel.y * def.scale;
            const prev = this.actions.get(name);
            const state = computeActionState(prev, nextValue, frameId);
            this.actions.set(name, state);
            if (state.pressed || state.released)
                this.actionEvent.emit({ name, state });
        }
    }

    private commitPointerSnapshot(): void {
        this.pointer.deltaX = this.pDelta.dx;
        this.pointer.deltaY = this.pDelta.dy;
        this.pDelta.dx = 0;
        this.pDelta.dy = 0;
        this.pointer.wheelX = this.pWheel.x;
        this.pointer.wheelY = this.pWheel.y;
        this.pointer.wheelZ = this.pWheel.z;
        this.pWheel.x = this.pWheel.y = this.pWheel.z = 0;
    }

    private commitInjectedAxes1D(frameId: number): void {
        const injectedNow = new Set<string>();
        for (const [name, value] of this.axis1Accum.entries()) {
            injectedNow.add(name);
            const prev = this.actions.get(name);
            const state = computeActionState(prev, value, frameId);
            this.actions.set(name, state);
            if (state.pressed || state.released)
                this.actionEvent.emit({ name, state });
        }
        for (const name of this.axis1PrevInjected) {
            if (!injectedNow.has(name)) {
                const prev = this.actions.get(name);
                const state = computeActionState(prev, 0, frameId);
                this.actions.set(name, state);
                if (state.pressed || state.released)
                    this.actionEvent.emit({ name, state });
            }
        }
        this.axis1PrevInjected = injectedNow;
        this.axis1Accum.clear();
    }

    private commitDerivedVec2(): void {
        for (const [name, def] of this.bindings.getVec2Defs()) {
            const obj = composeVec2From1D(def, this.actions);
            this.vec2State.set(name, obj);
        }
    }

    private finalizeSequences(): void {
        for (const action of this.seqPulse)
            this.setDigitalSource(action, 'seq', false);
        this.seqPulse.clear();
    }

    //#endregion
}
