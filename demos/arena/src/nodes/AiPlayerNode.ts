import {
    useFixedUpdate,
    useDestroy,
    useChild,
    useContext,
} from '@pulse-ts/core';
import { useInput } from '@pulse-ts/input';
import { GameCtx } from '../contexts';
import { ARENA_RADIUS } from '../config/arena';
import { getPlayerPosition } from '../ai/playerPositions';
import { computeAiDecision } from '../ai/aiDecision';
import { createAiState, updateAiState } from '../ai/aiState';
import type { AiPersonality } from '../ai/personalities';
import { LocalPlayerNode } from './LocalPlayerNode';

/** Source ID for AI digital input injection. */
const AI_SOURCE = 'ai:bot';

export interface AiPlayerNodeProps {
    /** Player index for the AI (0 or 1). */
    playerId: number;
    /** Input action name for 2D movement (e.g. 'p2Move'). */
    moveAction: string;
    /** Input action name for the dash button (e.g. 'p2Dash'). */
    dashAction: string;
    /** AI personality that drives decision-making. */
    personality: AiPersonality;
}

/**
 * AI-controlled player node. Wraps a standard {@link LocalPlayerNode}
 * and injects movement + dash inputs each fixed step based on the
 * selected {@link AiPersonality}.
 *
 * Maintains frame-to-frame {@link AiState} for stateful behaviors
 * like grudge, ambush, rhythm, and score-based adaptation.
 *
 * @param props - AI player configuration.
 *
 * @example
 * ```ts
 * useChild(AiPlayerNode, {
 *     playerId: 1,
 *     moveAction: 'p2Move',
 *     dashAction: 'p2Dash',
 *     personality: BRAWLER,
 * });
 * ```
 */
export function AiPlayerNode({
    playerId,
    moveAction,
    dashAction,
    personality,
}: Readonly<AiPlayerNodeProps>) {
    const input = useInput();
    const gameState = useContext(GameCtx);
    const opponentId = 1 - playerId;

    // Frame-to-frame state for stateful personality knobs
    const state = createAiState();

    // Mount the actual player — it reads from moveAction/dashAction
    // which we override via input injection below.
    // Pass personality color so the sphere renders in the AI's accent color.
    useChild(LocalPlayerNode, {
        playerId,
        moveAction,
        dashAction,
        customColor: personality.color,
    });

    useFixedUpdate(() => {
        // Only act during active gameplay
        if (gameState.phase !== 'playing') {
            input.releaseAxis2D(moveAction);
            input.injectDigital(dashAction, AI_SOURCE, false);
            return;
        }

        const [selfX, , selfZ] = getPlayerPosition(playerId);
        const [opX, , opZ] = getPlayerPosition(opponentId);

        const dt = 1 / 60;

        // Update state with current frame data
        updateAiState(
            state,
            selfX,
            selfZ,
            opX,
            opZ,
            gameState.scores[playerId],
            gameState.scores[opponentId],
            dt,
        );

        const decision = computeAiDecision(
            personality,
            state,
            selfX,
            selfZ,
            opX,
            opZ,
            ARENA_RADIUS,
            dt,
            Math.random(),
        );

        input.holdAxis2D(moveAction, { x: decision.moveX, y: decision.moveY });
        input.injectDigital(dashAction, AI_SOURCE, decision.dash);
    });

    useDestroy(() => {
        input.releaseAxis2D(moveAction);
        input.injectDigital(dashAction, AI_SOURCE, false);
    });
}
