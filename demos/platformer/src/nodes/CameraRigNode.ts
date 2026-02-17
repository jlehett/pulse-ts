import {
    useFrameUpdate,
    Transform,
    getComponent,
    type Node,
} from '@pulse-ts/core';
import { useThreeContext } from '@pulse-ts/three';

const CAMERA_OFFSET_X = 0;
const CAMERA_OFFSET_Y = 5;
const CAMERA_OFFSET_Z = 12;
const LERP_SPEED = 4;

export interface CameraRigNodeProps {
    target: Node;
}

export function CameraRigNode(props: Readonly<CameraRigNodeProps>) {
    const { camera } = useThreeContext();

    // Initial camera position
    camera.position.set(CAMERA_OFFSET_X, CAMERA_OFFSET_Y, CAMERA_OFFSET_Z);
    camera.lookAt(0, 1, 0);

    useFrameUpdate((dt) => {
        const targetTransform = getComponent(props.target, Transform);
        if (!targetTransform) return;

        const targetPos = targetTransform.localPosition;

        // Desired camera position: offset from player
        const desiredX = targetPos.x + CAMERA_OFFSET_X;
        const desiredY = targetPos.y + CAMERA_OFFSET_Y;
        const desiredZ = targetPos.z + CAMERA_OFFSET_Z;

        // Smooth follow via lerp
        const t = 1 - Math.exp(-LERP_SPEED * dt);
        camera.position.x += (desiredX - camera.position.x) * t;
        camera.position.y += (desiredY - camera.position.y) * t;
        camera.position.z += (desiredZ - camera.position.z) * t;

        // Look at player
        camera.lookAt(targetPos.x, targetPos.y + 1, targetPos.z);
    });
}
