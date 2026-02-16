import type {
    ExprBindings,
    BindingExpr,
    Axis1DBinding,
    Axis2DBinding,
    KeyBinding,
    ChordBinding,
    SequenceBinding,
    PointerVec2Modifiers,
} from './types';

/**
 * Minimal bindings registry: maps device inputs to action names.
 * Compiles declarative binding expressions into lookup tables consumed by
 * `InputService`. This is an internal utility and not part of the public API.
 *
 * @example
 * ```ts
 * import { BindingRegistry } from './registry';
 * import { Key } from './expr';
 * const reg = new BindingRegistry();
 * reg.setBindings({ jump: Key('Space') });
 * console.log(reg.getActionsForKey('Space')); // ['jump']
 * ```
 */
export class BindingRegistry {
    //#region Fields

    private keyBindings = new Map<string, string[]>();
    private buttonBindings = new Map<number, string[]>();
    private pointerMoveActions: string[] = [];
    private pointerVec2Modifiers = new Map<string, PointerVec2Modifiers>();
    private axes1D = new Map<
        string,
        { pos: string[]; neg: string[]; scale: number }
    >();
    private vec2Defs = new Map<
        string,
        {
            key1: string;
            key2: string;
            axis1: string;
            axis2: string;
            invert1?: boolean;
            invert2?: boolean;
        }
    >();
    private wheelBindings = new Map<string, { scale: number }>();
    private chords = new Map<string, { codes: string[] }>();
    private sequences = new Map<
        string,
        { steps: string[]; maxGapFrames: number; resetOnWrong: boolean }
    >();

    //#endregion

    //#region Public Methods

    /**
     * Set the bindings for the input service.
     * @param b The bindings to set.
     */
    setBindings(b: ExprBindings) {
        this.keyBindings.clear();
        this.buttonBindings.clear();
        this.pointerMoveActions = [];
        this.pointerVec2Modifiers.clear();
        this.axes1D.clear();
        this.vec2Defs.clear();
        this.wheelBindings.clear();
        this.mergeBindings(b);
    }

    /**
     * Merge the bindings for the input service into the current bindings.
     * @param b The bindings to merge.
     */
    mergeBindings(b: ExprBindings) {
        this.compileExprBindings(b);
    }

    /**
     * Get the actions a key is bound to.
     * @param code The key to get the actions for.
     * @returns The actions the key is bound to.
     */
    getActionsForKey(code: string): readonly string[] {
        return this.keyBindings.get(code) ?? [];
    }

    /**
     * Get the actions a button is bound to.
     * @param btn The button to get the actions for.
     * @returns The actions the button is bound to.
     */
    getActionsForButton(btn: number): readonly string[] {
        return this.buttonBindings.get(btn) ?? [];
    }

    /**
     * Get the actions that pointer movement is bound to.
     * @returns Array of action names.
     */
    getPointerMoveActions(): readonly string[] {
        return this.pointerMoveActions;
    }

    /**
     * Get the pointer vec2 modifiers for an action.
     * @param action The action to get the pointer vec2 modifiers for.
     * @returns The pointer vec2 modifiers.
     */
    getPointerVec2Modifiers(action: string): PointerVec2Modifiers | undefined {
        return this.pointerVec2Modifiers.get(action);
    }

    /**
     * Get the axes 1D keys.
     * @returns The axes 1D keys.
     */
    getAxes1DKeys(): Iterable<
        readonly [string, { pos: string[]; neg: string[]; scale: number }]
    > {
        return this.axes1D.entries();
    }

    /**
     * Get the vec2 definitions.
     * @returns The vec2 definitions.
     */
    getVec2Defs(): Iterable<
        readonly [
            string,
            {
                key1: string;
                key2: string;
                axis1: string;
                axis2: string;
                invert1?: boolean;
                invert2?: boolean;
            },
        ]
    > {
        return this.vec2Defs.entries();
    }

    /**
     * Get the wheel bindings.
     * @returns The wheel bindings.
     */
    getWheelBindings(): Iterable<readonly [string, { scale: number }]> {
        return this.wheelBindings.entries();
    }

    /**
     * Get the chords.
     * @returns The chords as [action, { codes }].
     */
    getChords(): Iterable<readonly [string, { codes: string[] }]> {
        return this.chords.entries();
    }

    /**
     * Get the sequences.
     * @returns The sequences as [action, { steps, maxGapFrames, resetOnWrong }].
     */
    getSequences(): Iterable<
        readonly [
            string,
            { steps: string[]; maxGapFrames: number; resetOnWrong: boolean },
        ]
    > {
        return this.sequences.entries();
    }

    //#endregion

    //#region Private Methods

    /**
     * Compile the expression bindings into the internal registry.
     * @param map The expression bindings to compile.
     */
    private compileExprBindings(map: ExprBindings) {
        for (const action of Object.keys(map)) {
            const raw = map[action]!;
            const list = Array.isArray(raw)
                ? (raw as BindingExpr[])
                : ([raw as BindingExpr] as BindingExpr[]);
            for (const expr of list) {
                switch (expr.type) {
                    case 'key':
                        this.addKeyBinding(expr.code, action);
                        break;
                    case 'pointerButton':
                        this.addButtonBinding(expr.button, action);
                        break;
                    case 'axis1d':
                        this.addAxis1D(action, expr);
                        break;
                    case 'axis2d':
                        this.addAxis2D(action, expr);
                        break;
                    case 'pointerMove':
                        this.pointerMoveActions.push(action);
                        this.pointerVec2Modifiers.set(action, {
                            invertX: expr.invertX,
                            invertY: expr.invertY,
                            scaleX: expr.scaleX,
                            scaleY: expr.scaleY,
                        });
                        break;
                    case 'wheel':
                        this.wheelBindings.set(action, {
                            scale: (expr as any).scale ?? 1,
                        });
                        break;
                    case 'chord':
                        this.addChord(action, expr);
                        break;
                    case 'sequence':
                        this.addSequence(action, expr);
                        break;
                    default:
                        break;
                }
            }
        }
    }

    /**
     * Add a key binding.
     * @param code The key code to bind.
     * @param action The action to bind the key to.
     */
    private addKeyBinding(code: string, action: string) {
        const arr = this.keyBindings.get(code) ?? [];
        arr.push(action);
        this.keyBindings.set(code, arr);
    }

    /**
     * Add a pointer button binding.
     * @param button The button index to bind.
     * @param action The action to bind the button to.
     */
    private addButtonBinding(button: number, action: string) {
        const arr = this.buttonBindings.get(button) ?? [];
        arr.push(action);
        this.buttonBindings.set(button, arr);
    }

    /**
     * Add an axis 1D binding.
     * @param name The name of the axis.
     * @param def The axis definition.
     */
    private addAxis1D(name: string, def: Axis1DBinding) {
        const pos = def.pos.map((k: KeyBinding) => k.code);
        const neg = def.neg.map((k: KeyBinding) => k.code);
        const scale = typeof def.scale === 'number' ? def.scale : 1;
        this.axes1D.set(name, { pos, neg, scale });
    }

    /**
     * Add an axis 2D binding.
     * @param action The action to bind the axis to.
     * @param def The axis definition.
     */
    private addAxis2D(action: string, def: Axis2DBinding) {
        const names = Object.keys(def.axes);
        if (names.length === 0) return;
        const xKey = names.includes('x') ? 'x' : names[0];
        const yKey = names.includes('y')
            ? 'y'
            : names.includes('z')
              ? 'z'
              : (names[1] ?? names[0]);
        const xName = `__axis:${action}:${xKey}`;
        const yName = `__axis:${action}:${yKey}`;
        this.addAxis1D(xName, def.axes[xKey]!);
        if (yKey !== xKey) this.addAxis1D(yName, def.axes[yKey]!);
        this.vec2Defs.set(action, {
            key1: xKey,
            key2: yKey,
            axis1: xName,
            axis2: yName,
            invert1: def.invertX,
            invert2: def.invertY,
        });
    }

    /**
     * Add a chord binding.
     * @param action The action to bind the chord to.
     * @param def The chord definition.
     */
    private addChord(action: string, def: ChordBinding) {
        const codes = def.keys.map((k) => k.code);
        this.chords.set(action, { codes });
    }

    /**
     * Add a sequence binding.
     * @param action The action to bind the sequence to.
     * @param def The sequence definition.
     */
    private addSequence(action: string, def: SequenceBinding) {
        const steps = def.steps.map((k) => k.code);
        const maxGapFrames =
            typeof def.maxGapFrames === 'number' ? def.maxGapFrames : 15;
        const resetOnWrong = def.resetOnWrong !== false;
        this.sequences.set(action, { steps, maxGapFrames, resetOnWrong });
    }

    //#endregion
}
