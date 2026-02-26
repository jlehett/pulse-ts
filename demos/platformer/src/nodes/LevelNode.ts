import * as THREE from 'three';
import { useChild, useProvideContext } from '@pulse-ts/core';
import { useThreeContext, useObject3D } from '@pulse-ts/three';
import { PlayerNode, type RespawnState, type ShakeState } from './PlayerNode';
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
import { RespawnCtx, ShakeCtx, CollectibleCtx, PlayerNodeCtx } from '../contexts';

export function LevelNode() {
    const { scene } = useThreeContext();

    // Lighting
    const ambient = new THREE.AmbientLight(0xb0c4de, 0.5);
    scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffffff, 1.0);
    directional.position.set(32, 25, 15);
    directional.castShadow = true;
    // 2048×2048 shadow map for the wider 3-stage level (X: 0–67).
    // The frustum is fitted to cover the full level bounds with margin.
    directional.shadow.mapSize.set(2048, 2048);
    directional.shadow.camera.near = 0.5;
    directional.shadow.camera.far = 100;
    directional.shadow.camera.left = -10;
    directional.shadow.camera.right = 72;
    directional.shadow.camera.top = 15;
    directional.shadow.camera.bottom = -12;
    scene.add(directional);

    // Fog for depth — pushed back to accommodate the wider level
    scene.fog = new THREE.Fog(0x0a0a1a, 40, 100);

    // Shared state — provided via context so descendants can read without prop drilling
    const respawnState: RespawnState = {
        position: [...level.playerSpawn],
    };
    const shakeState: ShakeState = { intensity: 0 };
    const collectibleState: CollectibleState = { collected: 0 };

    useProvideContext(RespawnCtx, respawnState);
    useProvideContext(ShakeCtx, shakeState);
    useProvideContext(CollectibleCtx, collectibleState);

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
