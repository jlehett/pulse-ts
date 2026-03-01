import { createContext } from '@pulse-ts/core';

/** Current phase of the round lifecycle. */
export type RoundPhase =
    | 'playing'
    | 'ko_flash'
    | 'resetting'
    | 'countdown'
    | 'match_over';

/** Game state — scores, round lifecycle, and match status. */
export interface GameState {
    scores: [number, number];
    round: number;
    /** Current round phase. */
    phase: RoundPhase;
    /** Player ID that was last knocked out (-1 = none). */
    lastKnockedOut: number;
    /** Countdown value: 3, 2, 1, 0 = "GO!", -1 = inactive. */
    countdownValue: number;
    /** Player ID of the match winner (-1 = no winner yet). */
    matchWinner: number;
    /** Pending knockout: player ID that just fell off (-1 = none). */
    pendingKnockout: number;
}

/** Shared game state context — read/written by GameManagerNode, read by HUD. */
export const GameCtx = createContext<GameState>('Game');
