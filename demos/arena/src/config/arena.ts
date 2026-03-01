/** Radius of the circular arena platform. */
export const ARENA_RADIUS = 14;

/** Y position below which a player is considered knocked out. */
export const DEATH_PLANE_Y = -10;

/** Starting positions for each player [P1, P2]. */
export const SPAWN_POSITIONS: readonly [
    [number, number, number],
    [number, number, number],
] = [
    [-5, 2, 0],
    [5, 2, 0],
];

/** Number of knockouts required to win a match. */
export const WIN_COUNT = 5;

/** Duration of the KO flash overlay in seconds. */
export const KO_FLASH_DURATION = 0.8;

/** Pause duration while players teleport back to spawn in seconds. */
export const RESET_PAUSE_DURATION = 0.5;

/** Total countdown duration in seconds (3-2-1-GO!). */
export const COUNTDOWN_DURATION = 4.0;
