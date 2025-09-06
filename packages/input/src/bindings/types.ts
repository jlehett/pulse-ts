// Core types for @pulse-ts/input

/**
 * The state of an action.
 */
export type ActionState = {
    /**
     * Whether the input bound to the action is currently held down.
     */
    down: boolean;
    /**
     * Whether the input bound to the action was just pressed down this frame.
     */
    pressed: boolean;
    /**
     * Whether the input bound to the action was just released this frame.
     */
    released: boolean;
    /**
     * The value of the action. 0..1 for digital; can be any number for axes
     */
    value: number;
    /**
     * The frame id when last state change occurred.
     */
    since: number;
};

/**
 * A vector with named components. Keys are dynamic per binding (e.g., x/y or x/z).
 */
export type Vec = Record<string, number>;

/**
 * A snapshot of the pointer state.
 */
export type PointerSnapshot = {
    /**
     * The x coordinate of the pointer.
     */
    x: number;
    /**
     * The y coordinate of the pointer.
     */
    y: number;
    /**
     * The x delta of the pointer.
     */
    deltaX: number;
    /**
     * The y delta of the pointer.
     */
    deltaY: number;
    /**
     * The x wheel delta of the pointer.
     */
    wheelX: number;
    /**
     * The y wheel delta of the pointer.
     */
    wheelY: number;
    /**
     * The z wheel delta of the pointer.
     */
    wheelZ: number;
    /**
     * The buttons of the pointer.
     */
    buttons: number;
    /**
     * Whether the pointer is locked.
     */
    locked: boolean;
};

/**
 * The options for the input service.
 */
export type InputOptions = {
    /**
     * The target to listen for events on. Defaults to window if present.
     */
    target?: EventTarget | null;
    /**
     * Whether to prevent default behavior of events. Defaults to true.
     */
    preventDefault?: boolean;
    /**
     * Whether to request pointer lock on pointerdown if available. Defaults to true.
     */
    pointerLock?: boolean;
};

/**
 * A provider for the input service.
 */
export interface InputProvider {
    /**
     * Start the provider.
     * @param target The target to listen for events on.
     */
    start(target: EventTarget): void;
    /**
     * Stop the provider.
     */
    stop(): void;
    /**
     * Update the provider.
     */
    update?(): void;
}

/**
 * A key binding.
 */
export type KeyBinding = { type: 'key'; code: string };

/**
 * An axis 1D binding.
 */
export type Axis1DBinding = {
    type: 'axis1d';
    /**
     * The positive key binding.
     */
    pos: KeyBinding[];
    /**
     * The negative key binding.
     */
    neg: KeyBinding[];
    /**
     * The scale of the axis.
     */
    scale?: number;
};

/**
 * An axis 2D binding.
 */
export type Axis2DBinding = {
    type: 'axis2d';
    /**
     * The axes of the axis 2D binding. Each key is the name of the axis, and the value is the axis definition.
     */
    axes: Record<string, Axis1DBinding>;
    /** Optional inversion for first component (commonly x). */
    invertX?: boolean;
    /** Optional inversion for second component (commonly y). */
    invertY?: boolean;
};

/**
 * A pointer movement binding.
 */
export type PointerMovementBinding = {
    type: 'pointerMove';
    /**
     * Whether to invert the x axis.
     */
    invertX?: boolean;
    /**
     * Whether to invert the y axis.
     */
    invertY?: boolean;
    /**
     * The scale of the x axis.
     */
    scaleX?: number;
    /**
     * The scale of the y axis.
     */
    scaleY?: number;
};

/**
 * A pointer wheel binding. Y-axis wheel delta only.
 */
export type PointerWheelBinding = {
    type: 'wheel';
    /**
     * The scale of the wheel.
     */
    scale?: number;
};

/** A chord (simultaneous keys) binding. */
export type ChordBinding = {
    type: 'chord';
    /** Keys that must be held down together. */
    keys: KeyBinding[];
};

/** A sequence (ordered key presses) binding. */
export type SequenceBinding = {
    type: 'sequence';
    /** Keys to press in order. */
    steps: KeyBinding[];
    /** Max frames allowed between successive steps. Default 15. */
    maxGapFrames?: number;
    /** Reset to start when a wrong key is pressed. Default true. */
    resetOnWrong?: boolean;
};

/**
 * A binding expression.
 */
export type BindingExpr =
    | KeyBinding
    | Axis1DBinding
    | Axis2DBinding
    | PointerMovementBinding
    | PointerWheelBinding
    | ChordBinding
    | SequenceBinding;

/**
 * A record of binding expressions. Each key is the name of the action, and the value is the binding expression.
 */
export type ExprBindings = Record<string, BindingExpr | BindingExpr[]>;
