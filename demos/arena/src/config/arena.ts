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

/** Number of seconds of gameplay to record for instant replay. */
export const REPLAY_BUFFER_SECONDS = 4;

/** Base playback speed as a fraction of real-time (0.8 = 80%). */
export const REPLAY_NORMAL_SPEED = 0.8;

/** Playback speed at the hit moment (slowest point). */
export const REPLAY_HIT_SPEED = 0.15;

/**
 * Number of game frames around the hit moment that receive slow-motion.
 * At 60Hz, 15 frames ≈ 0.25 seconds of game time.
 */
export const REPLAY_HIT_WINDOW_FRAMES = 15;

/** Player colors: P1 = teal, P2 = coral. */
export const PLAYER_COLORS = [0x48c9b0, 0xe74c3c] as const;

/** Minimum velocity magnitude for trail particles to appear (units/sec). */
export const TRAIL_VELOCITY_THRESHOLD = 3;

/** Base emission interval (seconds) at the threshold velocity. Faster movement = denser trail. */
export const TRAIL_BASE_INTERVAL = 0.015;
