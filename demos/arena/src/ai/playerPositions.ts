/**
 * Shared player position store.
 * Written by LocalPlayerNode each fixed step, read by AiPlayerNode
 * to determine the opponent's position.
 */

const positions: [[number, number, number], [number, number, number]] = [
    [0, 0, 0],
    [0, 0, 0],
];

/**
 * Update a player's shared position. Call once per fixed step from
 * LocalPlayerNode (or any node that owns a player entity).
 *
 * @param playerId - Player index (0 or 1).
 * @param x - World X position.
 * @param y - World Y position.
 * @param z - World Z position.
 *
 * @example
 * ```ts
 * setPlayerPosition(0, transform.localPosition.x, transform.localPosition.y, transform.localPosition.z);
 * ```
 */
export function setPlayerPosition(
    playerId: number,
    x: number,
    y: number,
    z: number,
): void {
    positions[playerId][0] = x;
    positions[playerId][1] = y;
    positions[playerId][2] = z;
}

/**
 * Read a player's last-known position. Returns a shared array reference
 * — do not mutate the returned tuple.
 *
 * @param playerId - Player index (0 or 1).
 * @returns `[x, y, z]` world position.
 *
 * @example
 * ```ts
 * const [ox, oy, oz] = getPlayerPosition(1); // opponent position
 * ```
 */
export function getPlayerPosition(
    playerId: number,
): readonly [number, number, number] {
    return positions[playerId];
}

/**
 * Reset all stored positions to origin. Useful for testing.
 */
export function resetPlayerPositions(): void {
    positions[0][0] = positions[0][1] = positions[0][2] = 0;
    positions[1][0] = positions[1][1] = positions[1][2] = 0;
}
