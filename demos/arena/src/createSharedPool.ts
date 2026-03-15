import { defineStore, useStore } from '@pulse-ts/core';
import { useEffectPool, type EffectPoolHandle } from '@pulse-ts/effects';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Configuration for {@link createSharedPool}.
 *
 * @typeParam T - Shape of user data stored in each pool slot.
 */
export interface SharedPoolConfig<T> {
    /** Maximum concurrent effects. */
    size: number;
    /** Duration in seconds before auto-deactivation. */
    duration: number;
    /** Factory for slot data. Called once per slot at pool creation. */
    create: () => T;
}

/**
 * Return type of {@link createSharedPool}.
 *
 * @typeParam T - Shape of user data stored in each pool slot.
 */
export interface SharedPool<T> {
    /** The world-scoped store holding the pool handle. */
    Store: ReturnType<typeof defineStore>;
    /** Hook that lazily creates or retrieves the shared pool. */
    usePool: () => EffectPoolHandle<T>;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a world-scoped shared effect pool backed by a store.
 *
 * The first caller of the returned `usePool` hook creates the pool via
 * `useEffectPool`; subsequent callers in the same world receive the same
 * handle.
 *
 * @typeParam T - Shape of user data stored in each pool slot.
 * @param name - Unique store name for this pool.
 * @param config - Pool configuration (size, duration, slot factory).
 * @returns An object containing the `Store` definition and the `usePool` hook.
 *
 * @example
 * ```ts
 * import { createSharedPool } from './createSharedPool';
 *
 * interface MyData { x: number; y: number; }
 *
 * export const { Store: MyStore, usePool: useMyPool } =
 *     createSharedPool<MyData>('myEffect', {
 *         size: 4, duration: 0.5, create: () => ({ x: 0, y: 0 }),
 *     });
 * ```
 */
export function createSharedPool<T>(
    name: string,
    config: SharedPoolConfig<T>,
): SharedPool<T> {
    const Store = defineStore(name, () => ({
        pool: null as EffectPoolHandle<T> | null,
    }));

    function usePool(): EffectPoolHandle<T> {
        const [store, setStore] = useStore(Store);

        if (!store.pool) {
            const pool = useEffectPool<T>(config);
            setStore({ pool });
        }

        return store.pool!;
    }

    return { Store, usePool };
}
