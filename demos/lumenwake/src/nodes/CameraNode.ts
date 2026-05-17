import { useFrameUpdate } from '@pulse-ts/core';
import { useService } from '@pulse-ts/core';
import { ThreeService } from '@pulse-ts/three';

const CAMERA_HEIGHT = 30;
const CAMERA_FOV = 50;

/**
 * Fixed top-down camera looking straight down at the arena.
 */
export function CameraNode() {
    const three = useService(ThreeService);

    three.camera.fov = CAMERA_FOV;
    three.camera.position.set(0, CAMERA_HEIGHT, 0);
    three.camera.lookAt(0, 0, 0);
    three.camera.updateProjectionMatrix();

    useFrameUpdate(() => {
        three.camera.position.set(0, CAMERA_HEIGHT, 0);
        three.camera.lookAt(0, 0, 0);
    });
}
