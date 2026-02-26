import * as THREE from 'three';
import {
    useWorld,
    useFixedEarly,
    useFrameUpdate,
    getComponent,
    Transform,
    type Node,
} from '@pulse-ts/core';
import { useThreeContext } from './hooks';

// ---------------------------------------------------------------------------
// Option types
// ---------------------------------------------------------------------------

/** Options for {@link useFollowCamera}. */
export interface FollowCameraOptions {
    /**
     * World-space offset from the target position to the desired camera position,
     * as `[x, y, z]`.
     *
     * @default [0, 8, 12]
     */
    offset?: [number, number, number];

    /**
     * World-space offset added to the target position when computing the
     * camera's lookAt point, as `[x, y, z]`. Useful for looking slightly above
     * the target's feet.
     *
     * @default [0, 1, 0]
     */
    lookAhead?: [number, number, number];

    /**
     * Exponential smoothing factor. Higher values make the camera catch up
     * faster; lower values produce a lazier follow.
     *
     * @default 4
     */
    smoothing?: number;

    /**
     * When `true`, the hook captures the target's previous physics-step
     * position in `fixedEarly` and interpolates between it and the current
     * position using `world.getAmbientAlpha()`. This eliminates per-step
     * jitter when the physics tick rate differs from the render rate.
     *
     * @default true
     */
    interpolate?: boolean;
}

/** Object returned by {@link useFollowCamera}. */
export interface FollowCameraResult {
    /** The Three.js camera being controlled. */
    camera: THREE.Camera;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Smoothed third-person follow camera that tracks a target `Node`.
 *
 * Handles fixed-step interpolation, exponential-decay smoothing, and lookAt
 * automatically. Returns the camera so callers can layer additional effects
 * (e.g. screen shake) on top.
 *
 * @param target - The `Node` to follow. Must have a `Transform` component.
 * @param options - Camera offset, lookAhead, smoothing, and interpolation settings.
 * @returns An object containing the controlled `camera`.
 *
 * @example
 * ```ts
 * import { useFollowCamera } from '@pulse-ts/three';
 *
 * function CameraRigNode(props: { target: Node }) {
 *   useFollowCamera(props.target, {
 *     offset: [0, 8, 12],
 *     lookAhead: [0, 1, 0],
 *     smoothing: 4,
 *     interpolate: true,
 *   });
 * }
 * ```
 *
 * @example
 * ```ts
 * import { useFollowCamera } from '@pulse-ts/three';
 * import { useFrameUpdate } from '@pulse-ts/core';
 *
 * function CameraWithShake(props: { target: Node; shake: { intensity: number } }) {
 *   const { camera } = useFollowCamera(props.target, {
 *     offset: [0, 5, 12],
 *   });
 *
 *   // Layer screen shake on top of the follow position
 *   useFrameUpdate((dt) => {
 *     if (props.shake.intensity > 0.001) {
 *       camera.position.x += (Math.random() - 0.5) * 2 * props.shake.intensity;
 *       camera.position.y += (Math.random() - 0.5) * 2 * props.shake.intensity;
 *       props.shake.intensity *= Math.exp(-12 * dt);
 *     }
 *   });
 * }
 * ```
 */
export function useFollowCamera(
    target: Node,
    options: FollowCameraOptions = {},
): FollowCameraResult {
    const {
        offset = [0, 8, 12],
        lookAhead = [0, 1, 0],
        smoothing = 4,
        interpolate = true,
    } = options;

    const world = useWorld();
    const { camera } = useThreeContext();

    // Initial camera placement at offset
    camera.position.set(offset[0], offset[1], offset[2]);
    camera.lookAt(lookAhead[0], lookAhead[1], lookAhead[2]);

    // Previous physics position — captured each fixed step for interpolation
    let prevX = 0;
    let prevY = 0;
    let prevZ = 0;

    if (interpolate) {
        // Snapshot in fixed.early — before physics integrates transforms —
        // so the frame update can interpolate between the two physics states.
        useFixedEarly(() => {
            const t = getComponent(target, Transform);
            if (!t) return;
            prevX = t.localPosition.x;
            prevY = t.localPosition.y;
            prevZ = t.localPosition.z;
        });
    }

    useFrameUpdate((dt) => {
        const targetTransform = getComponent(target, Transform);
        if (!targetTransform) return;

        const cur = targetTransform.localPosition;
        let tx: number, ty: number, tz: number;

        if (interpolate) {
            // Interpolated target position between prev and current physics state
            const alpha = world.getAmbientAlpha();
            tx = prevX + (cur.x - prevX) * alpha;
            ty = prevY + (cur.y - prevY) * alpha;
            tz = prevZ + (cur.z - prevZ) * alpha;
        } else {
            tx = cur.x;
            ty = cur.y;
            tz = cur.z;
        }

        // Desired camera position: offset from (interpolated) target position
        const desiredX = tx + offset[0];
        const desiredY = ty + offset[1];
        const desiredZ = tz + offset[2];

        // Smooth follow via exponential decay lerp
        const t = 1 - Math.exp(-smoothing * dt);
        camera.position.x += (desiredX - camera.position.x) * t;
        camera.position.y += (desiredY - camera.position.y) * t;
        camera.position.z += (desiredZ - camera.position.z) * t;

        // Look at target + lookAhead offset
        camera.lookAt(
            tx + lookAhead[0],
            ty + lookAhead[1],
            tz + lookAhead[2],
        );
    });

    return { camera };
}
