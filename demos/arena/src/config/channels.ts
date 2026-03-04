import { defineChannel } from '@pulse-ts/network';

/** Fired when a player is knocked off the arena. Payload: knocked-out player ID (0 or 1). */
export const KnockoutChannel = defineChannel<number>('knockout');

/** Fired when the round resets and players should teleport to spawn. Payload: round number. */
export const RoundResetChannel = defineChannel<number>('round-reset');

/** Scoring outcome broadcast by the host after a round ends. */
export interface ScoringOutcome {
    /** Player ID who scored (0 or 1), or -1 if tie. */
    scorer: number;
    /** Whether the round ended in a tie (both players knocked out simultaneously). */
    isTie: boolean;
}

/** Fired by the host to broadcast the authoritative scoring decision. */
export const ScoringOutcomeChannel =
    defineChannel<ScoringOutcome>('scoring-outcome');
