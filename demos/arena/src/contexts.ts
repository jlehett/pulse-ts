import { createContext, type Node } from '@pulse-ts/core';

/** Game state — scores and current round. */
export interface GameState {
    scores: [number, number];
    round: number;
}

/** Shared game state context — read/written by GameManagerNode, read by HUD. */
export const GameCtx = createContext<GameState>('Game');

/** Identifies which player this world controls (0 or 1). */
export const PlayerIdCtx = createContext<number>('PlayerId');

/** Reference to the local player's Node — read by camera rig and collision handlers. */
export const LocalPlayerNodeCtx = createContext<Node>('LocalPlayerNode');
