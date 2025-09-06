import { Service, TypedEvent } from '@pulse-ts/core';
import type {
    ActionState,
    InputOptions,
    InputProvider,
    PointerSnapshot,
    Vec,
    ExprBindings,
} from '../bindings/types';
import { BindingRegistry } from '../bindings/registry';

/**
 * World-scoped input service: collects device events, applies bindings, and exposes stable per-frame snapshots.
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
    attach(world: any): void {
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
     * Register a provider.
     * @param p The provider to register.
     */
    registerProvider(p: InputProvider): void {
        this.providers.push(p);
        const target = this.getTarget();
        if (target && this.world) p.start(target);
    }

    /**
     * Set the bindings.
     * @param b The bindings to set.
     */
    setBindings(b: ExprBindings): void {
        this.bindings.setBindings(b);
    }

    /**
     * Merge the bindings.
     * @param b The bindings to merge.
     */
    mergeBindings(b: ExprBindings): void {
        this.bindings.mergeBindings(b);
    }

    /**
     * Handle a key.
     * @param code The code of the key.
     * @param down Whether the key is down.
     */
    handleKey(code: string, down: boolean): void {
        const actions = this.bindings.getActionsForKey(code);
        for (const name of actions)
            this.setDigitalSource(name, `key:${code}`, down);
        // Track raw key state for axes1DKeys
        if (down) {
            this.keysDown.add(code);
            this.advanceSequences(code);
        } else this.keysDown.delete(code);
    }

    /**
     * Handle a pointer button.
     * @param button The button to handle.
     * @param down Whether the button is down.
     */
    handlePointerButton(button: number, down: boolean): void {
        const actions = this.bindings.getActionsForButton(button);
        for (const name of actions)
            this.setDigitalSource(name, `btn:${button}`, down);
    }

    /**
     * Handle a pointer move.
     * @param x The x coordinate.
     * @param y The y coordinate.
     * @param dx The x delta.
     * @param dy The y delta.
     * @param locked Whether the pointer is locked.
     * @param buttons The buttons.
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

        const action = this.bindings.getPointerMoveAction();
        if (action) {
            const mod = this.bindings.getPointerVec2Modifiers(action);
            const sx = (mod?.scaleX ?? 1) * (mod?.invertX ? -1 : 1);
            const sy = (mod?.scaleY ?? 1) * (mod?.invertY ? -1 : 1);
            const acc = (this.vec2Accum.get(action) ?? { x: 0, y: 0 }) as Vec;
            acc['x'] = (acc['x'] ?? 0) + dx * sx;
            acc['y'] = (acc['y'] ?? 0) + dy * sy;
            this.vec2Accum.set(action, acc);
        }
    }

    /**
     * Handle a wheel.
     * @param dx The x delta.
     * @param dy The y delta.
     * @param dz The z delta.
     */
    handleWheel(dx: number, dy: number, dz: number): void {
        this.pWheel.x += dx;
        this.pWheel.y += dy;
        this.pWheel.z += dz;
    }

    /**
     * Inject a digital action.
     * @param action The action to inject.
     * @param sourceId The source ID.
     * @param down Whether the action is down.
     */
    injectDigital(action: string, sourceId: string, down: boolean): void {
        this.setDigitalSource(action, sourceId, down);
    }

    /**
     * Inject an axis 2D action (per-frame delta).
     * @param action The action to inject.
     * @param axes The axes to inject.
     */
    injectAxis2D(action: string, axes: Vec): void {
        const a = this.vec2Accum.get(action) ?? { x: 0, y: 0 };
        Object.entries(axes).forEach(([key, value]) => {
            a[key] = (a[key] ?? 0) + value;
        });
        this.vec2Accum.set(action, a);
    }

    /**
     * Commit the input.
     */
    commit(): void {
        // allow providers to poll
        for (const p of this.providers) p.update?.();

        const frameId = (this.world as any)?.getFrameId?.() ?? 0;

        // Chords: evaluate current key-down set
        for (const [action, def] of this.bindings.getChords()) {
            const allDown = def.codes.every((c) => this.keysDown.has(c));
            this.setDigitalSource(action, 'chord', allDown);
        }

        // Sequence pulses from key events
        for (const action of this.seqPulse)
            this.setDigitalSource(action, 'seq', true);

        // Digital actions
        const seen = new Set<string>();
        for (const name of this.digitalSources.keys()) seen.add(name);
        for (const name of this.actions.keys()) seen.add(name);

        for (const name of seen) {
            const sources = this.digitalSources.get(name);
            const nextDown = !!(sources && sources.size > 0);
            const prev = this.actions.get(name) ?? {
                down: false,
                pressed: false,
                released: false,
                value: 0,
                since: frameId,
            };
            const pressed = nextDown && !prev.down;
            const released = !nextDown && prev.down;
            const since = pressed || released ? frameId : prev.since;
            const value = nextDown ? 1 : 0;
            const state: ActionState = {
                down: nextDown,
                pressed,
                released,
                value,
                since,
            };
            this.actions.set(name, state);
            if (pressed || released) this.actionEvent.emit({ name, state });
        }

        // Axes (1D) from key pairs -> produces analog values [-1, 0, +1]
        for (const [name, def] of this.bindings.getAxes1DKeys()) {
            const posActive = def.pos.some((c) => this.keysDown.has(c));
            const negActive = def.neg.some((c) => this.keysDown.has(c));
            let nextValue = (posActive ? 1 : 0) - (negActive ? 1 : 0);
            nextValue *= def.scale;
            const prev = this.actions.get(name) ?? {
                down: false,
                pressed: false,
                released: false,
                value: 0,
                since: frameId,
            };
            const down = nextValue !== 0;
            const pressed = down && !prev.down;
            const released = !down && prev.down;
            const since = pressed || released ? frameId : prev.since;
            const state: ActionState = {
                down,
                pressed,
                released,
                value: nextValue,
                since,
            };
            this.actions.set(name, state);
            if (pressed || released) this.actionEvent.emit({ name, state });
        }

        // Pointer vec2 (per-frame deltas): reset to {x:0,y:0} and apply accum
        const pAction = this.bindings.getPointerMoveAction();
        if (pAction) this.vec2State.set(pAction, { x: 0, y: 0 });
        for (const [name, v] of this.vec2Accum)
            this.vec2State.set(name, { ...v });
        // Clear accumulators for next frame
        this.vec2Accum.clear();

        // Wheel -> axis (per-frame), vertical only
        for (const [name, def] of this.bindings.getWheelBindings()) {
            const nextValue = this.pWheel.y * def.scale;
            const prev = this.actions.get(name) ?? {
                down: false,
                pressed: false,
                released: false,
                value: 0,
                since: frameId,
            };
            const down = nextValue !== 0;
            const pressed = down && !prev.down;
            const released = !down && prev.down;
            const since = pressed || released ? frameId : prev.since;
            const state: ActionState = {
                down,
                pressed,
                released,
                value: nextValue,
                since,
            };
            this.actions.set(name, state);
            if (pressed || released) this.actionEvent.emit({ name, state });
        }

        // Snapshot pointer deltas and wheel and clear accumulators
        this.pointer.deltaX = this.pDelta.dx;
        this.pointer.deltaY = this.pDelta.dy;
        this.pDelta.dx = 0;
        this.pDelta.dy = 0;
        this.pointer.wheelX = this.pWheel.x;
        this.pointer.wheelY = this.pWheel.y;
        this.pointer.wheelZ = this.pWheel.z;
        this.pWheel.x = this.pWheel.y = this.pWheel.z = 0;

        // Derived axis 2D from 1D axes (continuous vectors) with custom keys
        for (const [name, def] of this.bindings.getVec2Defs()) {
            const v1 = this.actions.get(def.axis1)?.value ?? 0;
            const v2 = this.actions.get(def.axis2)?.value ?? 0;
            const a = (def.invert1 ? -1 : 1) * v1;
            const b = (def.invert2 ? -1 : 1) * v2;
            const obj: Vec = {};
            obj[def.key1] = a;
            obj[def.key2] = b;
            this.vec2State.set(name, obj);
        }

        // Cleanup sequence pulses (one-frame)
        for (const action of this.seqPulse)
            this.setDigitalSource(action, 'seq', false);
        this.seqPulse.clear();
    }

    /**
     * Get the action state for a given action name.
     * @param name The name of the action.
     * @returns The action state.
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
     * Get the axis state for a given axis name.
     * @param name The name of the axis.
     * @returns The axis state.
     */
    axis(name: string): number {
        return this.action(name).value;
    }

    /**
     * Get the axis 2D state for a given axis 2D name.
     * @param name The name of the axis 2D.
     * @returns The axis 2D state.
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
        const pAction = this.bindings.getPointerMoveAction();
        if (pAction === name) return { x: 0, y: 0 };
        return { x: 0, y: 0 };
    }

    /**
     * Get the pointer state.
     * @returns The pointer state.
     */
    pointerState(): PointerSnapshot {
        return this.pointer;
    }

    //#endregion

    //#region Private Methods

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

    /** Advances sequences on keydown events. */
    private advanceSequences(code: string): void {
        const frameId = (this.world as any)?.getFrameId?.() ?? 0;
        for (const [action, def] of this.bindings.getSequences()) {
            let st = this.seqState.get(action);
            if (!st) {
                st = { index: 0, lastFrame: frameId };
                this.seqState.set(action, st);
            }
            // Timeout
            if (st.index > 0 && frameId - st.lastFrame > def.maxGapFrames) {
                st.index = 0;
            }
            const expected = def.steps[st.index];
            if (code === expected) {
                st.index++;
                st.lastFrame = frameId;
                if (st.index >= def.steps.length) {
                    this.seqPulse.add(action);
                    st.index = 0;
                }
            } else if (def.resetOnWrong !== false) {
                // allow immediate restart if key matches first step
                st.index = code === def.steps[0] ? 1 : 0;
                st.lastFrame = frameId;
            }
        }
    }

    //#endregion
}
