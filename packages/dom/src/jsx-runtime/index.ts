/**
 * JSX runtime entry point for `@pulse-ts/dom`.
 *
 * This module is automatically imported by TypeScript when `jsxImportSource`
 * is set to `"@pulse-ts/dom"` in `tsconfig.json`. It provides the `jsx`,
 * `jsxs`, and `Fragment` functions that TypeScript's `react-jsx` transform
 * expects.
 *
 * @example
 * ```json
 * // tsconfig.json
 * {
 *   "compilerOptions": {
 *     "jsx": "react-jsx",
 *     "jsxImportSource": "@pulse-ts/dom"
 *   }
 * }
 * ```
 *
 * @packageDocumentation
 */
import type { PulseElement, PulseChild } from '../domain/types';
import { Fragment } from '../domain/types';

export { Fragment };
export type { PulseElement };

/**
 * JSX factory for elements with a single child.
 *
 * Called automatically by the TypeScript JSX transform. Creates a
 * {@link PulseElement} descriptor — no DOM nodes are created at this point.
 *
 * @param type - HTML tag name, functional component, or {@link Fragment}.
 * @param props - Element props including `children`.
 * @returns A {@link PulseElement} descriptor.
 *
 * @example
 * ```tsx
 * // This JSX:
 * <div id="score">100</div>
 * // Compiles to:
 * jsx('div', { id: 'score', children: '100' })
 * ```
 */
export function jsx(
    type: PulseElement['type'],
    props: Record<string, any>,
): PulseElement {
    const { children, ...rest } = props;
    const childArray = normalizeChildren(children);
    return { type, props: rest, children: childArray };
}

/**
 * JSX factory for elements with multiple children.
 *
 * Identical to {@link jsx} — both produce a {@link PulseElement} descriptor.
 * TypeScript emits `jsxs` when an element has multiple static children.
 *
 * @param type - HTML tag name, functional component, or {@link Fragment}.
 * @param props - Element props including `children`.
 * @returns A {@link PulseElement} descriptor.
 *
 * @example
 * ```tsx
 * // This JSX:
 * <div><span>A</span><span>B</span></div>
 * // Compiles to:
 * jsxs('div', { children: [jsx('span', { children: 'A' }), jsx('span', { children: 'B' })] })
 * ```
 */
export function jsxs(
    type: PulseElement['type'],
    props: Record<string, any>,
): PulseElement {
    const { children, ...rest } = props;
    const childArray = normalizeChildren(children);
    return { type, props: rest, children: childArray };
}

function normalizeChildren(children: unknown): PulseChild[] {
    if (children == null) return [];
    if (Array.isArray(children)) return children;
    return [children as PulseChild];
}

// JSX types for TypeScript type-checking
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace JSX {
    export type Element = PulseElement;

    export interface IntrinsicElements {
        [tag: string]: Record<string, any>;
    }

    export interface ElementChildrenAttribute {
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        children: {};
    }
}
