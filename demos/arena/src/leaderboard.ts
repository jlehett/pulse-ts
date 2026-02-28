/** localStorage key used for the arena leaderboard. */
const STORAGE_KEY = 'pulse-arena-leaderboard';

/** A single match result recorded after a match ends. */
export interface MatchResult {
    /** Player ID of the winner (0 or 1). */
    winner: number;
    /** Final score of the losing player. */
    loserScore: number;
    /** ISO date string when the match was played. */
    date: string;
}

/** Aggregated leaderboard data persisted to localStorage. */
export interface LeaderboardData {
    /** Total wins for player 1 (index 0). */
    p1Wins: number;
    /** Total wins for player 2 (index 1). */
    p2Wins: number;
    /** Chronological list of all recorded match results. */
    history: MatchResult[];
}

/**
 * Return a default (zeroed) leaderboard.
 *
 * @returns A fresh {@link LeaderboardData} with zero wins and empty history.
 *
 * @example
 * ```ts
 * const fresh = defaultLeaderboard();
 * // { p1Wins: 0, p2Wins: 0, history: [] }
 * ```
 */
export function defaultLeaderboard(): LeaderboardData {
    return { p1Wins: 0, p2Wins: 0, history: [] };
}

/**
 * Load the leaderboard from localStorage.
 * Returns a zeroed default if the key is missing or the data is corrupt.
 *
 * @returns The current {@link LeaderboardData}.
 *
 * @example
 * ```ts
 * const board = loadLeaderboard();
 * console.log(`P1: ${board.p1Wins}, P2: ${board.p2Wins}`);
 * ```
 */
export function loadLeaderboard(): LeaderboardData {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return defaultLeaderboard();
        const parsed = JSON.parse(raw) as LeaderboardData;
        if (
            typeof parsed.p1Wins !== 'number' ||
            typeof parsed.p2Wins !== 'number' ||
            !Array.isArray(parsed.history)
        ) {
            return defaultLeaderboard();
        }
        return parsed;
    } catch {
        return defaultLeaderboard();
    }
}

/**
 * Record a match result and persist the updated leaderboard to localStorage.
 *
 * @param winner - Player ID of the winner (0 or 1).
 * @param loserScore - Final knockout score of the losing player.
 * @returns The updated {@link LeaderboardData} after saving.
 *
 * @example
 * ```ts
 * const updated = saveMatchResult(0, 3);
 * console.log(`P1 wins: ${updated.p1Wins}`);
 * ```
 */
export function saveMatchResult(
    winner: number,
    loserScore: number,
): LeaderboardData {
    const board = loadLeaderboard();
    if (winner === 0) board.p1Wins++;
    else board.p2Wins++;

    board.history.push({
        winner,
        loserScore,
        date: new Date().toISOString(),
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
    return board;
}

/**
 * Clear all leaderboard data from localStorage.
 *
 * @example
 * ```ts
 * clearLeaderboard();
 * const board = loadLeaderboard();
 * // board.p1Wins === 0, board.p2Wins === 0, board.history.length === 0
 * ```
 */
export function clearLeaderboard(): void {
    localStorage.removeItem(STORAGE_KEY);
}
