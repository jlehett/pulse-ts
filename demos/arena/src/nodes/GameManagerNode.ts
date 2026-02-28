import { useContext } from '@pulse-ts/core';
import { useChannel } from '@pulse-ts/network';
import { GameCtx } from '../contexts';
import { KnockoutChannel } from '../config/channels';

/**
 * Subscribes to knockout events and updates the shared game state.
 * When a player is knocked out, the *other* player scores a point.
 */
export function GameManagerNode() {
    const gameState = useContext(GameCtx);

    useChannel<number>(KnockoutChannel, (knockedOutPlayerId) => {
        // The player who was NOT knocked out scores
        const scorer = 1 - knockedOutPlayerId;
        gameState.scores[scorer]++;
    });
}
