import * as THREE from 'three';
import { useChild } from '@pulse-ts/core';
import { useThreeContext, useObject3D } from '@pulse-ts/three';
import { PlayerNode, type RespawnState } from './PlayerNode';
import { PlatformNode } from './PlatformNode';
import { MovingPlatformNode } from './MovingPlatformNode';
import { RotatingPlatformNode } from './RotatingPlatformNode';
import { CollectibleNode } from './CollectibleNode';
import { CheckpointNode } from './CheckpointNode';
import { HazardNode } from './HazardNode';
import { GoalNode } from './GoalNode';
import { CameraRigNode } from './CameraRigNode';
import { level } from '../config/level';

export function LevelNode() {
    const { scene } = useThreeContext();

    // Lighting
    const ambient = new THREE.AmbientLight(0xb0c4de, 0.5);
    scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffffff, 1.0);
    directional.position.set(10, 20, 10);
    directional.castShadow = true;
    // 1024×1024 is half the linear resolution of the original 2048 — 4× less
    // GPU memory and bandwidth. The tighter frustum below keeps texel density
    // acceptable by fitting the orthographic shadow volume to the actual level
    // bounds (x: 0–36, z: ±4, y: −10–12) rather than the original over-sized
    // box (left −30, right 50, top 20, bottom −10).
    directional.shadow.mapSize.set(1024, 1024);
    directional.shadow.camera.near = 0.5;
    directional.shadow.camera.far = 80;
    directional.shadow.camera.left = -5;
    directional.shadow.camera.right = 30;
    directional.shadow.camera.top = 15;
    directional.shadow.camera.bottom = -12;
    scene.add(directional);

    // Fog for depth
    scene.fog = new THREE.Fog(0x0a0a1a, 30, 80);

    // Shared respawn state — checkpoints and hazards update this
    const respawnState: RespawnState = {
        position: [...level.playerSpawn],
    };

    // Player
    const playerNode = useChild(PlayerNode, {
        spawn: level.playerSpawn,
        deathPlaneY: level.deathPlaneY,
        respawnState,
    });

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

    // Checkpoints
    for (const cp of level.checkpoints) {
        useChild(CheckpointNode, {
            position: cp.position,
            respawnState,
        });
    }

    // Hazards
    for (const hazard of level.hazards) {
        useChild(HazardNode, {
            position: hazard.position,
            size: hazard.size,
            color: hazard.color,
            respawnState,
            player: playerNode,
        });
    }

    // Goal
    useChild(GoalNode, { position: level.goalPosition });

    // Camera rig
    useChild(CameraRigNode, { target: playerNode });
}
