import type { World } from '../world/world';
import { current } from './runtime';

// ---------------------------------------------------------------------------
// Store registry — WeakMap keyed by World, each world stores a Map<symbol, instance>
// ---------------------------------------------------------------------------

const storeMaps = new WeakMap<World, Map<symbol, StoreInstance<unknown>>>();

function getStoreMap(world: World): Map<symbol, StoreInstance<unknown>> {
    let map = storeMaps.get(world);
    if (!map) {
        map = new Map();
        storeMaps.set(world, map);
    }
    return map;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Internal wrapper holding the current state for a store instance.
 * @internal
 */
interface StoreInstance<T> {
    state: T;
}

/**
 * A store definition created by {@link defineStore}. Pass this to
 * {@link useStore} to access world-scoped shared state.
 *
 * @typeParam T - The type of the state held by this store.
 */
export interface StoreDefinition<T> {
    /** @internal Unique symbol key for this store. */
    readonly _key: symbol;
    /** @internal Factory function that creates the initial state. */
    readonly _factory: () => T;
    /** @internal Phantom field for type inference — never set at runtime. */
    readonly _type: T;
}

/**
 * A setter function returned by {@link useStore}. Accepts either a partial
 * state object (shallow-merged) or an updater function that receives the
 * previous state and returns a partial update.
 *
 * @typeParam T - The type of the store state.
 */
export type SetStore<T> = (
    update: Partial<T> | ((prev: T) => Partial<T>),
) => void;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Defines a named store with a factory function that creates the initial state.
 * The factory is called once per world on first access via {@link useStore}.
 * The state is automatically cleaned up when the world is destroyed.
 *
 * Stores are complementary to contexts ({@link useContext}): contexts are
 * node-scoped (provided by a parent, consumed by descendants), while stores
 * are world-scoped singletons accessible from any node.
 *
 * @typeParam T - The type of the state this store holds.
 * @param name - Debug name for the store (included in error messages).
 * @param factory - Called to create the initial state for each world.
 * @returns A {@link StoreDefinition} usable with {@link useStore}.
 *
 * @example
 * ```ts
 * import { defineStore } from '@pulse-ts/core';
 *
 * const DashCooldownStore = defineStore('dashCooldown', () => ({
 *     progress: [1, 1] as [number, number],
 * }));
 * ```
 */
export function defineStore<T>(
    name: string,
    factory: () => T,
): StoreDefinition<T> {
    return {
        _key: Symbol(name),
        _factory: factory,
    } as StoreDefinition<T>;
}

/**
 * Accesses a world-scoped store. Creates the store on first access within the
 * current world. Returns the same instance for all callers in the same world.
 *
 * Returns a `[state, setState]` tuple. The `state` object is a stable reference
 * that is mutated in place by `setState`, so reading `state.field` in an update
 * callback always reflects the latest value.
 *
 * `setState` accepts either:
 * - A partial state object — shallow-merged into the current state.
 * - An updater function `(prev) => Partial<T>` — receives the current state
 *   and returns a partial update to shallow-merge.
 *
 * @typeParam T - The type of the store state.
 * @param definition - The store definition created by {@link defineStore}.
 * @returns A tuple of `[currentState, setState]`.
 *
 * @example
 * ```ts
 * import { defineStore, useStore } from '@pulse-ts/core';
 *
 * const ScoreStore = defineStore('score', () => ({
 *     values: [0, 0] as [number, number],
 * }));
 *
 * // Writing from one node
 * function ScoreKeeper() {
 *     const [, setScore] = useStore(ScoreStore);
 *
 *     useFixedUpdate(() => {
 *         setScore(prev => ({
 *             values: prev.values.map((v, i) => i === 0 ? v + 1 : v) as [number, number],
 *         }));
 *     });
 * }
 *
 * // Reading from another node
 * function ScoreHud() {
 *     const [score] = useStore(ScoreStore);
 *
 *     useFrameUpdate(() => {
 *         // score.values always reflects the latest state
 *     });
 * }
 * ```
 */
export function useStore<T extends Record<string, unknown>>(
    definition: StoreDefinition<T>,
): [T, SetStore<T>] {
    const { world } = current();
    const map = getStoreMap(world);

    let instance = map.get(definition._key) as StoreInstance<T> | undefined;
    if (!instance) {
        instance = { state: definition._factory() };
        map.set(definition._key, instance as StoreInstance<unknown>);
    }

    const state = instance.state;

    const setState: SetStore<T> = (update) => {
        const partial =
            typeof update === 'function' ? update(instance!.state) : update;
        Object.assign(instance!.state, partial);
    };

    return [state, setState];
}

/**
 * Clears all store instances for a world. Called internally by
 * `world.destroy()` to ensure stores are cleaned up.
 *
 * @param world - The world whose stores should be cleared.
 * @internal
 */
export function clearStores(world: World): void {
    storeMaps.delete(world);
}
