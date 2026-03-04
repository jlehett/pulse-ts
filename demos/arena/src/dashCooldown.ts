/**
 * Shared dash cooldown progress store.
 * Written by LocalPlayerNode each frame, read by HUD and touch controls
 * to display cooldown indicators.
 */

/** Per-player cooldown progress: 0 = on cooldown, 1 = ready. */
const progress: [number, number] = [1, 1];

/**
 * Update a player's dash cooldown progress.
 *
 * @param playerId - Player index (0 or 1).
 * @param value - Progress from 0 (just triggered) to 1 (ready).
 *
 * @example
 * ```ts
 * setDashCooldownProgress(0, 1 - dashCD.remaining / DASH_COOLDOWN);
 * ```
 */
export function setDashCooldownProgress(playerId: number, value: number): void {
    progress[playerId] = value;
}

/**
 * Read a player's dash cooldown progress.
 *
 * @param playerId - Player index (0 or 1).
 * @returns Progress from 0 (just triggered) to 1 (ready).
 *
 * @example
 * ```ts
 * const ready = getDashCooldownProgress(0) >= 1;
 * ```
 */
export function getDashCooldownProgress(playerId: number): number {
    return progress[playerId];
}

/**
 * Reset all cooldown progress to ready. Useful for testing.
 */
export function resetDashCooldownProgress(): void {
    progress[0] = 1;
    progress[1] = 1;
}
