import { defineStore } from '@pulse-ts/core';

/**
 * World-scoped store for shared player positions.
 * Written by LocalPlayerNode each fixed step, read by AiPlayerNode
 * to determine the opponent's position.
 *
 * Replaces the previous module-level arrays so that state is
 * automatically scoped to the world lifetime — no manual reset needed.
 *
 * @example
 * ```ts
 * import { useStore } from '@pulse-ts/core';
 * import { PlayerPositionStore, setPlayerPosition, getPlayerPosition } from '../ai/playerPositions';
 *
 * const [positions] = useStore(PlayerPositionStore);
 * setPlayerPosition(positions, 0, x, y, z);
 * const [ox, oy, oz] = getPlayerPosition(positions, 1);
 * ```
 */
export const PlayerPositionStore = defineStore('playerPositions', () => ({
    values: [
        [0, 0, 0],
        [0, 0, 0],
    ] as [[number, number, number], [number, number, number]],
}));

/** The data shape held by {@link PlayerPositionStore}. */
export type PlayerPositionData = ReturnType<
    (typeof PlayerPositionStore)['_factory']
>;

/**
 * Update a player's shared position. Call once per fixed step from
 * LocalPlayerNode (or any node that owns a player entity).
 *
 * @param store - The store data obtained via `useStore(PlayerPositionStore)`.
 * @param playerId - Player index (0 or 1).
 * @param x - World X position.
 * @param y - World Y position.
 * @param z - World Z position.
 *
 * @example
 * ```ts
 * setPlayerPosition(positions, 0, transform.localPosition.x, transform.localPosition.y, transform.localPosition.z);
 * ```
 */
export function setPlayerPosition(
    store: PlayerPositionData,
    playerId: number,
    x: number,
    y: number,
    z: number,
): void {
    store.values[playerId][0] = x;
    store.values[playerId][1] = y;
    store.values[playerId][2] = z;
}

/**
 * Read a player's last-known position. Returns a shared array reference
 * — do not mutate the returned tuple.
 *
 * @param store - The store data obtained via `useStore(PlayerPositionStore)`.
 * @param playerId - Player index (0 or 1).
 * @returns `[x, y, z]` world position.
 *
 * @example
 * ```ts
 * const [ox, oy, oz] = getPlayerPosition(positions, 1); // opponent position
 * ```
 */
export function getPlayerPosition(
    store: PlayerPositionData,
    playerId: number,
): readonly [number, number, number] {
    return store.values[playerId];
}
