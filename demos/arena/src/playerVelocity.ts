/**
 * Derived player velocity store.
 *
 * Kinematic bodies (RemotePlayerNode) report zero `linearVelocity` because
 * their position is driven by interpolation, not physics. This store tracks
 * position deltas each fixed step to derive velocity for any player,
 * regardless of body type.
 *
 * Written by both LocalPlayerNode and RemotePlayerNode each fixed step.
 * Read by LocalPlayerNode's collision handler for knockback calculation.
 */

interface PlayerVelocityState {
    prevX: number;
    prevZ: number;
    vx: number;
    vz: number;
}

const states: [PlayerVelocityState, PlayerVelocityState] = [
    { prevX: 0, prevZ: 0, vx: 0, vz: 0 },
    { prevX: 0, prevZ: 0, vx: 0, vz: 0 },
];

/**
 * Update a player's derived velocity from their current position.
 * Call once per fixed step from the player's node.
 *
 * @param playerId - Player index (0 or 1).
 * @param x - Current world X position.
 * @param z - Current world Z position.
 * @param dt - Fixed step delta time in seconds.
 *
 * @example
 * ```ts
 * updatePlayerVelocity(0, transform.localPosition.x, transform.localPosition.z, dt);
 * ```
 */
export function updatePlayerVelocity(
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
 * @param playerId - Player index (0 or 1).
 * @returns `[vx, vz]` velocity components in world units/second.
 *
 * @example
 * ```ts
 * const [vx, vz] = getPlayerVelocity(1);
 * ```
 */
export function getPlayerVelocity(playerId: number): readonly [number, number] {
    const s = states[playerId];
    return [s.vx, s.vz];
}

/**
 * Directly set a player's velocity (XZ). Use when authoritative velocity
 * data is available (e.g., replicated from the producer via snapshots)
 * instead of deriving from position deltas.
 *
 * @param playerId - Player index (0 or 1).
 * @param vx - Velocity X component in world units/second.
 * @param vz - Velocity Z component in world units/second.
 *
 * @example
 * ```ts
 * setPlayerVelocity(1, replicatedVx, replicatedVz);
 * ```
 */
export function setPlayerVelocity(
    playerId: number,
    vx: number,
    vz: number,
): void {
    const s = states[playerId];
    s.vx = vx;
    s.vz = vz;
}

/**
 * Reset all stored velocity state. Called on new game session.
 */
export function resetPlayerVelocity(): void {
    for (const s of states) {
        s.prevX = s.prevZ = s.vx = s.vz = 0;
    }
}
