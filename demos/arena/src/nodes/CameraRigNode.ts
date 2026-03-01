import { useThreeContext } from '@pulse-ts/three';

/** Fixed camera height above the arena center. */
export const CAMERA_HEIGHT = 26;

/** Small Z offset to avoid degenerate straight-down lookAt. */
export const CAMERA_Z_OFFSET = 2;

/**
 * Fixed overhead camera centered on the arena.
 * Both players are always visible on the small platform, so there is
 * no need to follow an individual player.
 */
export function CameraRigNode() {
    const { camera } = useThreeContext();

    camera.position.set(0, CAMERA_HEIGHT, CAMERA_Z_OFFSET);
    camera.lookAt(0, 0, 0);
}
