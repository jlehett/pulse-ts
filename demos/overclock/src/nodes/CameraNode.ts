import { useInit } from '@pulse-ts/core';
import { useThreeContext } from '@pulse-ts/three';

/**
 * Fixed battle camera: elevated behind the player's half, matching the
 * design's framing (board fills the view, bench at the bottom edge).
 */
export function CameraNode(): void {
    const { camera } = useThreeContext();
    useInit(() => {
        camera.fov = 38;
        camera.position.set(0, 16.2, 16.4);
        camera.lookAt(0, 0.2, 2.6);
        camera.updateProjectionMatrix();
    });
}
