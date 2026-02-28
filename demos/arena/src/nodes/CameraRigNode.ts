import { useContext } from '@pulse-ts/core';
import { useFollowCamera } from '@pulse-ts/three';
import { LocalPlayerNodeCtx } from '../contexts';

/** Camera offset — elevated, slightly behind for a top-down-ish arena view. */
export const CAMERA_OFFSET: [number, number, number] = [0, 18, 10];

/** Look-ahead bias — slightly above the player so the camera tilts down. */
const LOOK_AHEAD: [number, number, number] = [0, 0, 0];

/** Smoothing factor — how quickly the camera catches up to the player. */
const SMOOTHING = 6;

/**
 * Camera rig that follows the local player from an elevated rear angle.
 * Each world mounts its own CameraRigNode, so each canvas independently
 * tracks its own player.
 */
export function CameraRigNode() {
    const playerNode = useContext(LocalPlayerNodeCtx);

    useFollowCamera(playerNode, {
        offset: CAMERA_OFFSET,
        lookAhead: LOOK_AHEAD,
        smoothing: SMOOTHING,
        interpolate: true,
    });
}
