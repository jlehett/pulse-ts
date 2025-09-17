import type {
    Axis1DBinding,
    Axis2DBinding,
    KeyBinding,
    PointerMovementBinding,
    PointerWheelBinding,
    ChordBinding,
    SequenceBinding,
} from './types';

// Helpers to create declarative binding expressions

/**
 * Normalize a key code by converting single letters and digits to their corresponding KeyX codes.
 * @param k The key code to normalize.
 * @returns The normalized key code.
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
 * Create a key binding.
 * @param code The key code to bind.
 * @returns The key binding.
 */
export function Key(code: string): KeyBinding {
    return { type: 'key', code: normalizeKeyCode(code) };
}

/**
 * Create an Axis1D binding.
 * @param opts The options for the axis.
 * @param opts.pos The positive binding.
 * @param opts.neg The negative binding.
 * @param opts.scale The scale of the axis.
 * @returns The Axis1D binding.
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
    };
}

/**
 * Create an Axis2D binding.
 * @param axes The axes to bind. Each key is the name of the axis, and the value is the axis definition.
 * @param axes[].pos The positive binding.
 * @param axes[].neg The negative binding.
 * @param axes[].scale The scale of the axis.
 * @returns The Axis2D binding.
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
    };
}

/**
 * Create a PointerMovement binding.
 * @param opts The options for the pointer movement.
 * @param opts.invertX Whether to invert the x axis.
 * @param opts.invertY Whether to invert the y axis.
 * @param opts.scaleX The scale of the x axis.
 * @param opts.scaleY The scale of the y axis.
 * @returns The PointerMovement binding.
 */
export function PointerMovement(
    opts: {
        invertX?: boolean;
        invertY?: boolean;
        scaleX?: number;
        scaleY?: number;
    } = {},
): PointerMovementBinding {
    return { type: 'pointerMove', ...opts };
}

/**
 * Create a PointerWheelScroll binding.
 * @param opts The options for the pointer wheel scroll.
 * @param opts.scale The scale of the wheel scroll.
 * @returns The PointerWheelScroll binding.
 */
export function PointerWheelScroll(
    opts: { scale?: number } = {},
): PointerWheelBinding {
    return { type: 'wheel', scale: opts.scale ?? 1 };
}

/**
 * Create a Chord binding (simultaneous keys).
 */
export function Chord(keys: (KeyBinding | string)[]): ChordBinding {
    const ks: KeyBinding[] = keys.map((k) =>
        typeof k === 'string' ? Key(k) : k,
    );
    return { type: 'chord', keys: ks };
}

/**
 * Create a Sequence binding (ordered key presses within a frame window).
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
    };
}
