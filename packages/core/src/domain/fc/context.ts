import type { Node } from '../ecs/base/node';
import { current } from './runtime';
import { ancestors } from '../world/traversal';

// ---------------------------------------------------------------------------
// Context storage — WeakMap keyed by Node, each node stores a Map<symbol, unknown>
// ---------------------------------------------------------------------------

const contextMaps = new WeakMap<Node, Map<symbol, unknown>>();

function getContextMap(node: Node): Map<symbol, unknown> {
    let map = contextMaps.get(node);
    if (!map) {
        map = new Map();
        contextMaps.set(node, map);
    }
    return map;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * A typed context key created by {@link createContext}. Passed to
 * {@link useProvideContext} and {@link useContext} to share values
 * across the node tree without prop drilling.
 *
 * @typeParam T - The type of the value stored in this context.
 */
export interface Context<T> {
    /** @internal Unique symbol key for this context. */
    readonly _key: symbol;
    /** @internal Default value returned by {@link useOptionalContext} when no provider exists. */
    readonly _defaultValue: T | undefined;
    /** @internal Phantom field for type inference — never set at runtime. */
    readonly _type: T;
}

/**
 * Creates a typed context key for sharing values across the node tree.
 *
 * A context allows an ancestor node to provide a value via
 * {@link useProvideContext}, and any descendant node to read it via
 * {@link useContext} — without threading the value through intermediate
 * props.
 *
 * An optional `defaultValue` can be provided. When set,
 * {@link useOptionalContext} returns this default instead of `undefined`
 * when no provider is found in the tree.
 *
 * @typeParam T - The type of the value this context holds.
 * @param name - Optional debug name included in error messages.
 * @param defaultValue - Optional default value returned by {@link useOptionalContext} when no provider exists.
 * @returns A typed {@link Context} key.
 *
 * @example
 * ```ts
 * import { createContext, useProvideContext, useContext } from '@pulse-ts/core';
 *
 * interface ScoreState { score: number }
 * const ScoreCtx = createContext<ScoreState>('Score');
 *
 * function GameRoot() {
 *     useProvideContext(ScoreCtx, { score: 0 });
 *     useChild(HudNode);
 * }
 *
 * function HudNode() {
 *     const state = useContext(ScoreCtx);
 *     // state.score is available here
 * }
 * ```
 *
 * @example
 * ```ts
 * // With a default value — useOptionalContext returns this when no provider exists
 * const ThemeCtx = createContext<{ dark: boolean }>('Theme', { dark: false });
 * ```
 */
export function createContext<T>(name?: string, defaultValue?: T): Context<T> {
    return {
        _key: Symbol(name ?? 'pulse:context'),
        _defaultValue: defaultValue,
    } as Context<T>;
}

/**
 * Provides a value for a context on the current node. All descendant
 * nodes can read this value via {@link useContext}.
 *
 * If a descendant also provides the same context, the descendant's
 * value takes precedence for its own subtree (shadowing).
 *
 * @typeParam T - The type of the context value.
 * @param ctx - The context key created by {@link createContext}.
 * @param value - The value to provide.
 *
 * @example
 * ```ts
 * import { createContext, useProvideContext, useChild } from '@pulse-ts/core';
 *
 * const ThemeCtx = createContext<{ color: number }>('Theme');
 *
 * function Root() {
 *     useProvideContext(ThemeCtx, { color: 0xff0000 });
 *     useChild(ChildNode);
 * }
 * ```
 */
export function useProvideContext<T>(ctx: Context<T>, value: T): void {
    const node = current().node;
    const map = getContextMap(node);
    map.set(ctx._key, value);
}

/**
 * Reads the nearest ancestor's provided value for a context.
 *
 * Walks up the node tree from the current node's parent to the root,
 * returning the first matching value. Throws if no provider is found.
 * Use {@link useOptionalContext} if a missing provider should return
 * `undefined` instead.
 *
 * @typeParam T - The type of the context value.
 * @param ctx - The context key created by {@link createContext}.
 * @returns The context value from the nearest ancestor provider.
 * @throws Error if no ancestor provides this context.
 *
 * @example
 * ```ts
 * import { createContext, useContext } from '@pulse-ts/core';
 *
 * const ScoreCtx = createContext<{ score: number }>('Score');
 *
 * function HudNode() {
 *     const state = useContext(ScoreCtx);
 *     // use state.score
 * }
 * ```
 */
export function useContext<T>(ctx: Context<T>): T {
    const node = current().node;

    // Check the current node first (provider on self)
    const selfMap = contextMaps.get(node);
    if (selfMap?.has(ctx._key)) {
        return selfMap.get(ctx._key) as T;
    }

    // Walk ancestors
    for (const ancestor of ancestors(node)) {
        const map = contextMaps.get(ancestor);
        if (map?.has(ctx._key)) {
            return map.get(ctx._key) as T;
        }
    }

    const name = ctx._key.description ?? 'unknown';
    throw new Error(
        `useContext: No provider found for context "${name}". ` +
            'Wrap a parent node with useProvideContext() to provide this value.',
    );
}

/**
 * Reads the nearest ancestor's provided value for a context, returning
 * the context's default value (or `undefined`) if no provider is found.
 *
 * This is the non-throwing variant of {@link useContext}. Useful when
 * a context is truly optional and the node can function without it.
 *
 * If the context was created with a default value via
 * `createContext('name', defaultValue)`, that default is returned when
 * no provider exists. Otherwise, returns `undefined`.
 *
 * @typeParam T - The type of the context value.
 * @param ctx - The context key created by {@link createContext}.
 * @returns The context value, the context's default value, or `undefined`.
 *
 * @example
 * ```ts
 * import { createContext, useOptionalContext } from '@pulse-ts/core';
 *
 * const DebugCtx = createContext<{ verbose: boolean }>('Debug');
 *
 * function GameNode() {
 *     const debug = useOptionalContext(DebugCtx);
 *     if (debug?.verbose) { /* ... *\/ }
 * }
 * ```
 *
 * @example
 * ```ts
 * // With a default value
 * const ThemeCtx = createContext<{ dark: boolean }>('Theme', { dark: false });
 *
 * function GameNode() {
 *     const theme = useOptionalContext(ThemeCtx);
 *     // theme is { dark: false } even without a provider
 * }
 * ```
 */
export function useOptionalContext<T>(ctx: Context<T>): T | undefined {
    const node = current().node;

    // Check the current node first
    const selfMap = contextMaps.get(node);
    if (selfMap?.has(ctx._key)) {
        return selfMap.get(ctx._key) as T;
    }

    // Walk ancestors
    for (const ancestor of ancestors(node)) {
        const map = contextMaps.get(ancestor);
        if (map?.has(ctx._key)) {
            return map.get(ctx._key) as T;
        }
    }

    return ctx._defaultValue;
}
