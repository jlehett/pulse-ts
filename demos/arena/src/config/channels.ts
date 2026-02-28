import { defineChannel } from '@pulse-ts/network';

/** Fired when a player is knocked off the arena. Payload: knocked-out player ID (0 or 1). */
export const KnockoutChannel = defineChannel<number>('knockout');
