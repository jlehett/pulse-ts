/**
 * A reactive value — either a static value or a function that returns one.
 * Function values are dirty-checked each frame.
 */
export type ReactiveValue<T> = T | (() => T);

/**
 * Style properties that support reactive values.
 * Each CSS property value can be a static string/number or a function
 * that returns one, dirty-checked each frame.
 */
export type ReactiveStyle = {
    [K in keyof CSSStyleDeclaration]?: ReactiveValue<string>;
};

/**
 * A reactive binding tracked for per-frame dirty-checking.
 */
export type ReactiveBinding = {
    /** Getter function that produces the current value. */
    get: () => unknown;
    /** The last value applied to the DOM. */
    prev: unknown;
    /** Applies a new value to the DOM. */
    apply: (value: unknown) => void;
};

/**
 * The result of creating a DOM tree from JSX.
 */
export type DomTree = {
    /** The root DOM element of this tree. */
    root: globalThis.Element | DocumentFragment;
    /** All reactive bindings in this tree, evaluated each frame. */
    bindings: ReactiveBinding[];
};

/**
 * A pulse-ts DOM functional component.
 * Called once at mount time; returns a JSX element.
 */
export type DomFC<P = object> = (props: P) => PulseElement;

/**
 * The internal representation of a JSX element before DOM creation.
 */
export type PulseElement = {
    type: string | DomFC<any> | typeof Fragment;
    props: Record<string, any>;
    children: PulseChild[];
};

/**
 * Valid children in JSX expressions.
 */
export type PulseChild =
    | PulseElement
    | string
    | number
    | boolean
    | null
    | undefined
    | (() => string | number)
    | PulseChild[];

/**
 * Sentinel symbol for the Fragment type.
 */
export const Fragment = Symbol.for('pulse-dom-fragment');
