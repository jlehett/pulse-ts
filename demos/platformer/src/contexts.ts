import { createContext, type Node } from '@pulse-ts/core';
import type { RespawnState } from './nodes/PlayerNode';
import type { CollectibleState } from './nodes/CollectibleNode';

/** Shared respawn position — written by CheckpointNode, read by hazards/enemies/player. */
export const RespawnCtx = createContext<RespawnState>('Respawn');

/** Shared collectible counter — written by CollectibleNode, read by HUD. */
export const CollectibleCtx = createContext<CollectibleState>('Collectible');

/** Player node reference — read by hazards/enemies that need to modify the player. */
export const PlayerNodeCtx = createContext<Node>('PlayerNode');
