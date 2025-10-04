import type {
    Axis1DBinding,
    Axis2DBinding,
    KeyBinding,
    PointerMovementBinding,
    PointerWheelBinding,
    PointerButtonBinding,
    ChordBinding,
    SequenceBinding,
} from './types';

// Helpers to create declarative binding expressions

/**
 * Normalize a key code by converting single letters and digits to their corresponding `KeyboardEvent.code` strings.
 * For example, `w` → `KeyW`, `5` → `Digit5`.
 * @param k The key code to normalize.
 * @returns The normalized `KeyboardEvent.code`.
 * @internal
 */
function normalizeKeyCode(k: string): string {
    if (!k) return k;
    if (k.length === 1) {
        const ch = k.toUpperCase();
        if (ch >= 'A' && ch <= 'Z') return `Key${ch}`;
        if (ch >= '0' && ch <= '9') return `Digit${ch}`;
    }
    return k; // assume already a KeyboardEvent.code
}

/**
 * Create a key binding expression.
 * @param code Keyboard code or shorthand; letters or digits are normalized (e.g., `w` → `KeyW`).
 * @returns The key binding expression.
 *
 * @example
 * ```ts
 * import { Key } from '@pulse-ts/input';
 * const jump = Key('Space');
 * ```
 */
export function Key(code: string): KeyBinding {
    return { type: 'key', code: normalizeKeyCode(code) };
}

/**
 * Create an Axis1D binding (e.g., horizontal movement or wheel scaling).
 * @param opts Axis options.
 * @param opts.pos Positive key(s).
 * @param opts.neg Negative key(s).
 * @param opts.scale Optional multiplier (defaults to 1).
 * @returns The Axis1D binding expression.
 *
 * @example
 * ```ts
 * import { Axis1D, Key } from '@pulse-ts/input';
 * const moveX = Axis1D({ pos: Key('D'), neg: Key('A') });
 * ```
 */
export function Axis1D(opts: {
    pos?: KeyBinding | KeyBinding[];
    neg?: KeyBinding | KeyBinding[];
    scale?: number;
}): Axis1DBinding {
    const toArr = (v?: KeyBinding | KeyBinding[]) =>
        !v ? [] : Array.isArray(v) ? v : [v];
    return {
        type: 'axis1d',
        pos: toArr(opts.pos),
        neg: toArr(opts.neg),
        scale: opts.scale,
    } as Axis1DBinding;
}

/**
 * Create an Axis2D binding (mapping two Axis1D to a vector, e.g., WASD).
 * @param axes Map of component name → axis definition (e.g., `{ x: {...}, y: {...} }`).
 * @returns The Axis2D binding expression.
 *
 * @example
 * ```ts
 * import { Axis2D, Key } from '@pulse-ts/input';
 * const move = Axis2D({ x: { pos: Key('D'), neg: Key('A') }, y: { pos: Key('W'), neg: Key('S') } });
 * ```
 */
export function Axis2D(
    axes: Record<
        string,
        {
            pos?: KeyBinding | KeyBinding[];
            neg?: KeyBinding | KeyBinding[];
            scale?: number;
        }
    >,
): Axis2DBinding {
    const axesOut: Axis2DBinding['axes'] = {};
    for (const name of Object.keys(axes)) {
        const def = axes[name]!;
        axesOut[name] = Axis1D(def);
    }
    return {
        type: 'axis2d',
        axes: axesOut,
    } as Axis2DBinding;
}

/**
 * Create a pointer movement binding (maps mouse/touch delta to a 2D axis).
 * @param opts Pointer options (invert/scale per-axis).
 * @returns The pointer movement binding expression.
 *
 * @example
 * ```ts
 * import { PointerMovement } from '@pulse-ts/input';
 * const look = PointerMovement({ scaleX: 0.1, scaleY: 0.1 });
 * ```
 */
export function PointerMovement(
    opts: {
        invertX?: boolean;
        invertY?: boolean;
        scaleX?: number;
        scaleY?: number;
    } = {},
): PointerMovementBinding {
    return { type: 'pointerMove', ...opts } as PointerMovementBinding;
}

/**
 * Create a mouse wheel binding (Y-axis). Produces per-frame deltas.
 * @param opts Optional scale multiplier (default 1).
 * @returns The wheel binding expression.
 *
 * @example
 * ```ts
 * import { PointerWheelScroll } from '@pulse-ts/input';
 * const zoom = PointerWheelScroll({ scale: 1.0 });
 * ```
 */
export function PointerWheelScroll(
    opts: { scale?: number } = {},
): PointerWheelBinding {
    return { type: 'wheel', scale: opts.scale ?? 1 } as PointerWheelBinding;
}

/**
 * Create a pointer button binding (maps a specific pointer/mouse button to a digital action).
 * @param button Button index (0 = primary, 1 = middle, 2 = secondary, ...).
 * @returns The pointer button binding expression.
 *
 * @example
 * ```ts
 * import { PointerButton } from '@pulse-ts/input';
 * const fire = PointerButton(0);
 * ```
 */
export function PointerButton(button: number): PointerButtonBinding {
    return { type: 'pointerButton', button } as PointerButtonBinding;
}

/**
 * Create a chord binding (simultaneous keys must be held down together).
 * @param keys Array of `Key(...)` or shorthand strings.
 * @returns The chord binding expression.
 *
 * @example
 * ```ts
 * import { Chord, Key } from '@pulse-ts/input';
 * const jump = Chord([Key('Space')]);
 * ```
 */
export function Chord(keys: (KeyBinding | string)[]): ChordBinding {
    const ks: KeyBinding[] = keys.map((k) =>
        typeof k === 'string' ? Key(k) : k,
    );
    return { type: 'chord', keys: ks } as ChordBinding;
}

/**
 * Create a sequence binding (ordered key presses within a frame window).
 * @param steps Keys in order. Use `Key(...)` or shorthand strings (normalized).
 * @param opts Optional `{ maxGapFrames, resetOnWrong }`.
 * @returns The sequence binding expression.
 *
 * @example
 * ```ts
 * import { Sequence, Key } from '@pulse-ts/input';
 * const dash = Sequence([Key('KeyD'), Key('KeyS')], { maxGapFrames: 10 });
 * ```
 */
export function Sequence(
    steps: (KeyBinding | string)[],
    opts: { maxGapFrames?: number; resetOnWrong?: boolean } = {},
): SequenceBinding {
    const ss: KeyBinding[] = steps.map((k) =>
        typeof k === 'string' ? Key(k) : k,
    );
    return {
        type: 'sequence',
        steps: ss,
        maxGapFrames: opts.maxGapFrames,
        resetOnWrong: opts.resetOnWrong,
    } as SequenceBinding;
}
