import { defineStore } from '@pulse-ts/core';

/**
 * Derived player velocity state for a single player.
 */
export interface PlayerVelocityState {
    prevX: number;
    prevZ: number;
    vx: number;
    vz: number;
}

/**
 * Store definition for derived player velocities.
 *
 * Kinematic bodies (RemotePlayerNode) report zero `linearVelocity` because
 * their position is driven by interpolation, not physics. This store tracks
 * position deltas each fixed step to derive velocity for any player,
 * regardless of body type.
 *
 * Written by both LocalPlayerNode and RemotePlayerNode each fixed step.
 * Read by LocalPlayerNode's collision handler for knockback calculation.
 *
 * @example
 * ```ts
 * import { useStore } from '@pulse-ts/core';
 * import { PlayerVelocityStore } from '../playerVelocity';
 *
 * const [velocities] = useStore(PlayerVelocityStore);
 * const vx = velocities.states[0].vx;
 * ```
 */
export const PlayerVelocityStore = defineStore('playerVelocity', () => ({
    states: [
        { prevX: 0, prevZ: 0, vx: 0, vz: 0 },
        { prevX: 0, prevZ: 0, vx: 0, vz: 0 },
    ] as [PlayerVelocityState, PlayerVelocityState],
}));

/**
 * Update a player's derived velocity from their current position.
 * Call once per fixed step from the player's node.
 *
 * @param states - The velocity states tuple from the store.
 * @param playerId - Player index (0 or 1).
 * @param x - Current world X position.
 * @param z - Current world Z position.
 * @param dt - Fixed step delta time in seconds.
 *
 * @example
 * ```ts
 * const [velocities] = useStore(PlayerVelocityStore);
 * updatePlayerVelocity(velocities.states, 0, pos.x, pos.z, dt);
 * ```
 */
export function updatePlayerVelocity(
    states: [PlayerVelocityState, PlayerVelocityState],
    playerId: number,
    x: number,
    z: number,
    dt: number,
): void {
    const s = states[playerId];
    if (dt > 0) {
        s.vx = (x - s.prevX) / dt;
        s.vz = (z - s.prevZ) / dt;
    }
    s.prevX = x;
    s.prevZ = z;
}

/**
 * Get a player's derived velocity (XZ plane only).
 *
 * @param states - The velocity states tuple from the store.
 * @param playerId - Player index (0 or 1).
 * @returns `[vx, vz]` velocity components in world units/second.
 *
 * @example
 * ```ts
 * const [velocities] = useStore(PlayerVelocityStore);
 * const [vx, vz] = getPlayerVelocity(velocities.states, 1);
 * ```
 */
export function getPlayerVelocity(
    states: [PlayerVelocityState, PlayerVelocityState],
    playerId: number,
): readonly [number, number] {
    const s = states[playerId];
    return [s.vx, s.vz];
}

/**
 * Directly set a player's velocity (XZ). Use when authoritative velocity
 * data is available (e.g., replicated from the producer via snapshots)
 * instead of deriving from position deltas.
 *
 * @param states - The velocity states tuple from the store.
 * @param playerId - Player index (0 or 1).
 * @param vx - Velocity X component in world units/second.
 * @param vz - Velocity Z component in world units/second.
 *
 * @example
 * ```ts
 * const [velocities] = useStore(PlayerVelocityStore);
 * setPlayerVelocity(velocities.states, 1, replicatedVx, replicatedVz);
 * ```
 */
export function setPlayerVelocity(
    states: [PlayerVelocityState, PlayerVelocityState],
    playerId: number,
    vx: number,
    vz: number,
): void {
    const s = states[playerId];
    s.vx = vx;
    s.vz = vz;
}
