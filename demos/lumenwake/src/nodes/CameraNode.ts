import * as THREE from 'three';
import { useFrameUpdate, useService } from '@pulse-ts/core';
import { ThreeService } from '@pulse-ts/three';

const CAMERA_DISTANCE = 22;
const CAMERA_FOV = 55;
const CAMERA_LERP_SPEED = 6.0;

/**
 * Top-down camera that always looks at the player perpendicular to the
 * sphere surface. Positioned along the surface normal at the player's
 * location so the view is always "straight down" relative to the ground
 * the player stands on.
 */
export function CameraNode(props?: { sphereRadius?: number }) {
    const three = useService(ThreeService);
    const sphereRadius = props?.sphereRadius ?? 12;

    three.camera.fov = CAMERA_FOV;
    three.camera.near = 0.5;
    three.camera.far = 200;
    three.camera.updateProjectionMatrix();

    // Default position (before player exists)
    const defaultPos = new THREE.Vector3(0, sphereRadius + CAMERA_DISTANCE, 0);
    three.camera.position.copy(defaultPos);
    three.camera.lookAt(0, 0, 0);

    const targetCameraPos = new THREE.Vector3().copy(defaultPos);
    const currentCameraPos = new THREE.Vector3().copy(defaultPos);

    let playerPos: THREE.Vector3 | null = null;

    // Stable "up" reference for the camera to prevent spinning.
    // We track a camera-space "up" vector and keep it consistent frame to frame.
    const cameraUp = new THREE.Vector3(0, 0, -1);

    useFrameUpdate((dt) => {
        if (playerPos) {
            const normal = playerPos.clone().normalize();

            // Camera sits directly above player along surface normal
            targetCameraPos
                .copy(playerPos)
                .addScaledVector(normal, CAMERA_DISTANCE);

            // Smooth follow
            const lerpFactor = 1 - Math.exp(-CAMERA_LERP_SPEED * dt);
            currentCameraPos.lerp(targetCameraPos, lerpFactor);
            three.camera.position.copy(currentCameraPos);

            // Look at the player
            three.camera.lookAt(playerPos);

            // Maintain a stable up direction to avoid camera spin.
            // Project previous cameraUp onto the new tangent plane and re-orthogonalize.
            const dot = cameraUp.dot(normal);
            cameraUp.sub(normal.clone().multiplyScalar(dot));
            if (cameraUp.lengthSq() < 1e-6) {
                // Degenerate (at pole) — pick an arbitrary tangent
                const ref =
                    Math.abs(normal.y) < 0.99
                        ? new THREE.Vector3(0, 1, 0)
                        : new THREE.Vector3(1, 0, 0);
                cameraUp.crossVectors(normal, ref);
            }
            cameraUp.normalize();

            // Set the camera's up vector to our stable reference
            three.camera.up.copy(cameraUp);
            three.camera.lookAt(playerPos);
        }
    });

    return {
        setPlayerTransform(position: THREE.Vector3) {
            playerPos = position;
        },
        getScreenRight(): THREE.Vector3 {
            // Right in camera space projected to world = camera's local X axis
            const right = new THREE.Vector3();
            right.setFromMatrixColumn(three.camera.matrixWorld, 0);
            return right;
        },
        getScreenUp(): THREE.Vector3 {
            // Up in camera space projected to world = camera's local Y axis
            const up = new THREE.Vector3();
            up.setFromMatrixColumn(three.camera.matrixWorld, 1);
            return up;
        },
    };
}
