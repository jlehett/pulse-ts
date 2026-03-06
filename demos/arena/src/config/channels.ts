import { defineChannel } from '@pulse-ts/network';

/** Fired when a player is knocked off the arena. Payload: knocked-out player ID (0 or 1). */
export const KnockoutChannel = defineChannel<number>('knockout');

/** Fired by the host to signal the non-host to start its countdown timer.
 *  The non-host starts immediately and sends an ack back. The host uses the
 *  round-trip time to estimate one-way latency and fast-forwards its own
 *  timer by RTT/2, keeping both countdowns in sync. Payload: round number. */
export const CountdownStartChannel = defineChannel<number>('countdown-start');

/** Sent by the non-host to acknowledge the countdown-start signal.
 *  The host measures RTT from this round-trip. Payload: round number. */
export const CountdownAckChannel = defineChannel<number>('countdown-ack');

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

/** Rematch negotiation message exchanged between players after a match. */
export interface RematchMessage {
    /** The type of rematch message. */
    type: 'offer' | 'accept' | 'decline';
}

/** Channel for rematch offer/accept/decline negotiation in online mode. */
export const RematchChannel = defineChannel<RematchMessage>('rematch');
