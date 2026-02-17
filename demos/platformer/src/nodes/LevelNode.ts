import * as THREE from 'three';
import { useChild } from '@pulse-ts/core';
import { useThreeContext, useObject3D } from '@pulse-ts/three';
import { PlayerNode } from './PlayerNode';
import { PlatformNode } from './PlatformNode';
import { CollectibleNode } from './CollectibleNode';
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
    directional.shadow.mapSize.set(2048, 2048);
    directional.shadow.camera.near = 0.5;
    directional.shadow.camera.far = 80;
    directional.shadow.camera.left = -30;
    directional.shadow.camera.right = 50;
    directional.shadow.camera.top = 20;
    directional.shadow.camera.bottom = -10;
    scene.add(directional);

    // Fog for depth
    scene.fog = new THREE.Fog(0x0a0a1a, 30, 80);

    // Player
    const playerNode = useChild(PlayerNode, {
        spawn: level.playerSpawn,
        deathPlaneY: level.deathPlaneY,
    });

    // Platforms
    for (const plat of level.platforms) {
        useChild(PlatformNode, {
            position: plat.position,
            size: plat.size,
            color: plat.color,
        });
    }

    // Collectibles
    for (const col of level.collectibles) {
        useChild(CollectibleNode, {
            position: col.position,
        });
    }

    // Camera rig
    useChild(CameraRigNode, { target: playerNode });
}
