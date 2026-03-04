import { createContext } from '@pulse-ts/core';

/** Current phase of the round lifecycle. */
export type RoundPhase =
    | 'intro'
    | 'playing'
    | 'replay'
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
    /** Second pending knockout slot for tie detection (-1 = none). */
    pendingKnockout2: number;
    /** Whether the current round ended in a tie (both players fell simultaneously). */
    isTie: boolean;
    /** Whether the game is currently paused. */
    paused: boolean;
    /** Custom player labels (e.g. `['You', 'Brawler']` in solo mode). */
    playerLabels?: [string, string];
    /** Custom player CSS colors (e.g. personality accent for P2 in solo mode). */
    playerColors?: [string, string];
    /** Custom player hex colors for particle effects (e.g. `[0x48c9b0, 0xe74c3c]`). */
    playerHexColors?: [number, number];
}

/** Shared game state context — read/written by GameManagerNode, read by HUD. */
export const GameCtx = createContext<GameState>('Game');
