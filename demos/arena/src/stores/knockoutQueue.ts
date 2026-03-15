import { defineStore } from '@pulse-ts/core';

/**
 * World-scoped store for the pending knockout queue.
 *
 * Written by `LocalPlayerNode` / `RemotePlayerNode` when a player falls off
 * the arena, consumed by `GameManagerNode` to drive the scoring state machine.
 *
 * Two slots allow simultaneous knockouts (tie detection):
 * - `pending`: first player ID that fell (-1 = none)
 * - `pending2`: second player ID for tie detection (-1 = none)
 *
 * @example
 * ```ts
 * import { useStore } from '@pulse-ts/core';
 * import { KnockoutQueueStore } from '../knockoutQueue';
 *
 * const [ko] = useStore(KnockoutQueueStore);
 * if (ko.pending >= 0) {
 *     // A player has been knocked out
 * }
 * ```
 */
export const KnockoutQueueStore = defineStore('knockoutQueue', () => ({
    /** Player ID that just fell off (-1 = none). */
    pending: -1,
    /** Second pending knockout slot for tie detection (-1 = none). */
    pending2: -1,
}));
