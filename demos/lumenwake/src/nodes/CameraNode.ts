import * as THREE from 'three';
import { useFrameUpdate, useService } from '@pulse-ts/core';
import { ThreeService } from '@pulse-ts/three';

const CAMERA_DISTANCE = 18;
const CAMERA_HEIGHT_OFFSET = 12;
const CAMERA_FOV = 55;
const CAMERA_LERP_SPEED = 4.0;

/**
 * Third-person camera that follows a player on the planetoid surface.
 * Positions itself offset along the surface normal (above the player)
 * and slightly behind, always looking at the player position.
 *
 * When no player position is set, defaults to an orbital view.
 */
export function CameraNode(props?: { sphereRadius?: number }) {
    const three = useService(ThreeService);
    const sphereRadius = props?.sphereRadius ?? 12;

    three.camera.fov = CAMERA_FOV;
    three.camera.near = 0.5;
    three.camera.far = 200;
    three.camera.updateProjectionMatrix();

    // Default orbital position (before player exists)
    const defaultPos = new THREE.Vector3(0, sphereRadius + CAMERA_HEIGHT_OFFSET, CAMERA_DISTANCE);
    three.camera.position.copy(defaultPos);
    three.camera.lookAt(0, 0, 0);

    const targetCameraPos = new THREE.Vector3().copy(defaultPos);
    const targetLookAt = new THREE.Vector3(0, 0, 0);
    const currentLookAt = new THREE.Vector3(0, 0, 0);

    let playerPos: THREE.Vector3 | null = null;
    let playerForward: THREE.Vector3 | null = null;

    useFrameUpdate((dt) => {
        if (playerPos && playerForward) {
            // Camera positioned above and behind the player on the sphere
            const normal = playerPos.clone().normalize();
            const behind = playerForward.clone().negate();

            // Offset: up along normal + behind player
            targetCameraPos.copy(playerPos)
                .add(normal.clone().multiplyScalar(CAMERA_HEIGHT_OFFSET))
                .add(behind.multiplyScalar(CAMERA_DISTANCE * 0.4));

            targetLookAt.copy(playerPos).add(normal.clone().multiplyScalar(2));
        }

        // Smooth follow
        const lerpFactor = 1 - Math.exp(-CAMERA_LERP_SPEED * dt);
        three.camera.position.lerp(targetCameraPos, lerpFactor);
        currentLookAt.lerp(targetLookAt, lerpFactor);
        three.camera.lookAt(currentLookAt);
    });

    return {
        setPlayerTransform(position: THREE.Vector3, forward: THREE.Vector3) {
            playerPos = position;
            playerForward = forward;
        },
    };
}
