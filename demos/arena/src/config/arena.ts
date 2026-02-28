/** Radius of the circular arena platform. */
export const ARENA_RADIUS = 10;

/** Y position below which a player is considered knocked out. */
export const DEATH_PLANE_Y = -10;

/** Starting positions for each player [P1, P2]. */
export const SPAWN_POSITIONS: readonly [
    [number, number, number],
    [number, number, number],
] = [
    [-3, 2, 0],
    [3, 2, 0],
];

/** Number of knockouts required to win a match. */
export const WIN_COUNT = 5;
