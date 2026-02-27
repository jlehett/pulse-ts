import { useContext } from '@pulse-ts/core';
import { useFollowCamera } from '@pulse-ts/three';
import { PlayerNodeCtx } from '../contexts';

const CAMERA_OFFSET_X = 0;
const CAMERA_OFFSET_Y = 5;
const CAMERA_OFFSET_Z = 12;
const LERP_SPEED = 4;

export function CameraRigNode() {
    const playerNode = useContext(PlayerNodeCtx);

    useFollowCamera(playerNode, {
        offset: [CAMERA_OFFSET_X, CAMERA_OFFSET_Y, CAMERA_OFFSET_Z],
        lookAhead: [0, 1, 0],
        smoothing: LERP_SPEED,
        interpolate: true,
    });
}
