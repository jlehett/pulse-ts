import { createContext, type Node } from '@pulse-ts/core';
import type { ParticleEmitter } from '@pulse-ts/effects';
import type { RespawnState, ShakeState } from './nodes/PlayerNode';
import type { CollectibleState } from './nodes/CollectibleNode';

/** Shared respawn position — written by CheckpointNode, read by hazards/enemies/player. */
export const RespawnCtx = createContext<RespawnState>('Respawn');

/** Shared shake state — written by PlayerNode on hard landing, read by CameraRigNode. */
export const ShakeCtx = createContext<ShakeState>('Shake');

/** Shared collectible counter — written by CollectibleNode, read by HUD. */
export const CollectibleCtx = createContext<CollectibleState>('Collectible');

/** Player node reference — read by hazards/enemies that need to modify the player. */
export const PlayerNodeCtx = createContext<Node>('PlayerNode');

/** Scene-level particle emitter — written by ParticleEffectsNode, read by CollectibleNode/EnemyNode. */
export const ParticleEffectsCtx = createContext<ParticleEmitter>('ParticleEffects');
