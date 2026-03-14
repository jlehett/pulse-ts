import { useFixedUpdate, useFrameUpdate } from './hooks';

/**
 * Watches a derived value each tick and invokes a callback when the value
 * changes (strict equality). Skips the initial value — the callback only
 * fires on subsequent changes.
 *
 * By default, evaluation happens in the fixed update loop. Pass
 * `{ kind: 'frame' }` to evaluate in the frame update loop instead.
 *
 * Uses `===` for comparison. For object/array watching, the selector should
 * return a primitive derived value (e.g., `() => state.round`, not
 * `() => state`).
 *
 * @typeParam T - The type of the watched value.
 * @param selector - A function that returns the value to watch.
 * @param callback - Called with `(newValue, previousValue)` when the value changes.
 * @param options - Optional configuration.
 * @param options.kind - Tick phase: `'fixed'` (default) or `'frame'`.
 *
 * @example
 * ```ts
 * import { useWatch } from '@pulse-ts/core';
 *
 * // Round reset detection
 * useWatch(() => gameState.round, () => {
 *     transform.localPosition.set(...spawn);
 *     body.setLinearVelocity(0, 0, 0);
 * });
 * ```
 *
 * @example
 * ```ts
 * // Phase transition with previous value
 * useWatch(() => gameState.phase, (phase, prev) => {
 *     if (phase === 'playing' && prev !== 'playing') {
 *         dashCD.trigger();
 *     }
 * });
 * ```
 *
 * @example
 * ```ts
 * // Frame-rate evaluation
 * useWatch(() => animState.current, (state) => {
 *     // respond to animation state change
 * }, { kind: 'frame' });
 * ```
 */
export function useWatch<T>(
    selector: () => T,
    callback: (value: T, prev: T) => void,
    options?: { kind?: 'fixed' | 'frame' },
): void {
    let prev = selector();

    const tick = () => {
        const next = selector();
        if (next !== prev) {
            const old = prev;
            prev = next;
            callback(next, old);
        }
    };

    const useUpdate =
        options?.kind === 'frame' ? useFrameUpdate : useFixedUpdate;
    useUpdate(tick);
}
