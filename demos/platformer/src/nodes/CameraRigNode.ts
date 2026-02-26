import {
    useWorld,
    useFixedEarly,
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
    const world = useWorld();
    const { camera } = useThreeContext();

    // Initial camera position
    camera.position.set(CAMERA_OFFSET_X, CAMERA_OFFSET_Y, CAMERA_OFFSET_Z);
    camera.lookAt(0, 1, 0);

    // Previous physics position of the target — snapshotted each fixed step
    // so the frame update can interpolate between prevTarget and curTarget
    // using alpha. Without this the camera lurches once per physics tick
    // (visible as jitter when physics Hz != render Hz).
    let prevTargetX = 0;
    let prevTargetY = 0;
    let prevTargetZ = 0;

    // Snapshot in fixed.early — before PhysicsSystem integrates transforms in
    // fixed.update — so prevTarget holds the pre-step position and the frame
    // update can interpolate correctly between the two physics states.
    useFixedEarly(() => {
        const t = getComponent(props.target, Transform);
        if (!t) return;
        prevTargetX = t.localPosition.x;
        prevTargetY = t.localPosition.y;
        prevTargetZ = t.localPosition.z;
    });

    useFrameUpdate((dt) => {
        const targetTransform = getComponent(props.target, Transform);
        if (!targetTransform) return;

        const cur = targetTransform.localPosition;
        const alpha = world.getAmbientAlpha();

        // Interpolated target position between previous and current physics state
        const tx = prevTargetX + (cur.x - prevTargetX) * alpha;
        const ty = prevTargetY + (cur.y - prevTargetY) * alpha;
        const tz = prevTargetZ + (cur.z - prevTargetZ) * alpha;

        // Desired camera position: offset from interpolated player position
        const desiredX = tx + CAMERA_OFFSET_X;
        const desiredY = ty + CAMERA_OFFSET_Y;
        const desiredZ = tz + CAMERA_OFFSET_Z;

        // Smooth follow via exponential decay lerp
        const t = 1 - Math.exp(-LERP_SPEED * dt);
        camera.position.x += (desiredX - camera.position.x) * t;
        camera.position.y += (desiredY - camera.position.y) * t;
        camera.position.z += (desiredZ - camera.position.z) * t;

        // Look at interpolated player position
        camera.lookAt(tx, ty + 1, tz);
    });
}
