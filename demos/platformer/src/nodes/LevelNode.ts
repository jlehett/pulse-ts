import { useChild, useProvideContext } from '@pulse-ts/core';
import { useAmbientLight, useDirectionalLight, useFog } from '@pulse-ts/three';
import { installParticles } from '@pulse-ts/effects';
import { PlayerNode, type RespawnState } from './PlayerNode';
import { PlatformNode } from './PlatformNode';
import { MovingPlatformNode } from './MovingPlatformNode';
import { RotatingPlatformNode } from './RotatingPlatformNode';
import { CollectibleNode, type CollectibleState } from './CollectibleNode';
import { CollectibleHudNode } from './CollectibleHudNode';
import { CheckpointNode } from './CheckpointNode';
import { HazardNode } from './HazardNode';
import { EnemyNode } from './EnemyNode';
import { GoalNode } from './GoalNode';
import { CameraRigNode } from './CameraRigNode';
import { level } from '../config/level';
import { RespawnCtx, CollectibleCtx, PlayerNodeCtx } from '../contexts';

export function LevelNode() {
    // Lighting
    useAmbientLight({ color: 0xb0c4de, intensity: 0.5 });

    // 2048×2048 shadow map for the wider 3-stage level (X: 0–67).
    // The frustum is fitted to cover the full level bounds with margin.
    useDirectionalLight({
        color: 0xffffff,
        intensity: 1.0,
        position: [32, 25, 15],
        castShadow: true,
        shadowMapSize: 2048,
        shadowBounds: {
            near: 0.5,
            far: 100,
            left: -10,
            right: 72,
            top: 15,
            bottom: -12,
        },
    });

    // Fog for depth — pushed back to accommodate the wider level
    useFog({ color: 0x0a0a1a, near: 40, far: 100 });

    // Shared state — provided via context so descendants can read without prop drilling
    const respawnState: RespawnState = {
        position: [...level.playerSpawn],
    };
    const collectibleState: CollectibleState = { collected: 0 };

    useProvideContext(RespawnCtx, respawnState);
    useProvideContext(CollectibleCtx, collectibleState);

    // Particle effects — world-level service for shared particle pools
    installParticles({ maxPerPool: 200, defaultSize: 0.08 });

    // Player
    const playerNode = useChild(PlayerNode, {
        spawn: level.playerSpawn,
        deathPlaneY: level.deathPlaneY,
    });

    useProvideContext(PlayerNodeCtx, playerNode);

    // Platforms
    for (const plat of level.platforms) {
        useChild(PlatformNode, {
            position: plat.position,
            size: plat.size,
            color: plat.color,
        });
    }

    // Moving platforms
    for (const mp of level.movingPlatforms) {
        useChild(MovingPlatformNode, {
            position: mp.position,
            target: mp.target,
            size: mp.size,
            color: mp.color,
            speed: mp.speed,
        });
    }

    // Rotating platforms
    for (const rp of level.rotatingPlatforms) {
        useChild(RotatingPlatformNode, {
            position: rp.position,
            size: rp.size,
            color: rp.color,
            angularSpeed: rp.angularSpeed,
        });
    }

    // Collectibles
    for (const col of level.collectibles) {
        useChild(CollectibleNode, {
            position: col.position,
        });
    }

    // Collectible HUD
    useChild(CollectibleHudNode, {
        total: level.collectibles.length,
    });

    // Checkpoints
    for (const cp of level.checkpoints) {
        useChild(CheckpointNode, {
            position: cp.position,
        });
    }

    // Hazards
    for (const hazard of level.hazards) {
        useChild(HazardNode, {
            position: hazard.position,
            size: hazard.size,
            color: hazard.color,
        });
    }

    // Enemies
    for (const enemy of level.enemies) {
        useChild(EnemyNode, {
            position: enemy.position,
            target: enemy.target,
            size: enemy.size,
            color: enemy.color,
            speed: enemy.speed,
        });
    }

    // Goal
    useChild(GoalNode, { position: level.goalPosition });

    // Camera rig
    useChild(CameraRigNode);
}
