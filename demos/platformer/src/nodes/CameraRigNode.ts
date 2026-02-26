import { useFrameUpdate, useContext } from '@pulse-ts/core';
import { useFollowCamera } from '@pulse-ts/three';
import { PlayerNodeCtx, ShakeCtx } from '../contexts';

const CAMERA_OFFSET_X = 0;
const CAMERA_OFFSET_Y = 5;
const CAMERA_OFFSET_Z = 12;
const LERP_SPEED = 4;

/** Exponential decay rate for shake intensity (per second). */
export const SHAKE_DECAY = 12;

/** Maximum camera offset (world units) from shake, preventing extreme jolts. */
export const SHAKE_MAX = 0.8;

export function CameraRigNode() {
    const playerNode = useContext(PlayerNodeCtx);
    const shakeState = useContext(ShakeCtx);

    const { camera } = useFollowCamera(playerNode, {
        offset: [CAMERA_OFFSET_X, CAMERA_OFFSET_Y, CAMERA_OFFSET_Z],
        lookAhead: [0, 1, 0],
        smoothing: LERP_SPEED,
        interpolate: true,
    });

    // Camera shake — applied on top of the follow position.
    // Intensity is written by PlayerNode on hard landings and decayed here
    // each frame via exponential falloff.
    useFrameUpdate((dt) => {
        const shake = shakeState;
        if (shake.intensity > 0.001) {
            const offset = Math.min(shake.intensity, SHAKE_MAX);
            camera.position.x += (Math.random() - 0.5) * 2 * offset;
            camera.position.y += (Math.random() - 0.5) * 2 * offset;
            shake.intensity *= Math.exp(-SHAKE_DECAY * dt);
        } else {
            shake.intensity = 0;
        }
    });
}
