import * as THREE from 'three';
import { useThreeContext } from './hooks';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A point in 3D world space. */
export interface WorldPoint {
    /** X coordinate. */
    x: number;
    /** Y coordinate. */
    y: number;
    /** Z coordinate. */
    z: number;
}

/** A projected point in screen space. */
export interface ScreenPoint {
    /** Screen-space X in pixels (0 = left edge). */
    x: number;
    /** Screen-space Y in pixels (0 = top edge). */
    y: number;
    /** Normalized depth (0 = near, 1 = far). Useful for z-sorting overlays. */
    depth: number;
    /** Whether the point is in front of the camera. */
    visible: boolean;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Returns a projection function that converts world-space positions to
 * screen-space pixel coordinates.
 *
 * Uses the active Three.js camera and renderer dimensions. Reuses an
 * internal `Vector3` so no allocations occur per call. The returned
 * `ScreenPoint` object is also reused — callers should consume values
 * immediately rather than storing across frames.
 *
 * @returns A function that projects a {@link WorldPoint} to a {@link ScreenPoint}.
 *
 * @example
 * ```ts
 * import { useScreenProjection } from '@pulse-ts/three';
 * import { useFrameUpdate } from '@pulse-ts/core';
 *
 * function HealthBarNode() {
 *   const project = useScreenProjection();
 *
 *   useFrameUpdate(() => {
 *     const { x, y, visible } = project(root.position);
 *     if (visible) {
 *       indicator.style.left = `${x}px`;
 *       indicator.style.top = `${y}px`;
 *     }
 *   });
 * }
 * ```
 *
 * @example
 * ```ts
 * // Computing a screen-space radius from a world-space offset
 * const project = useScreenProjection();
 *
 * useFrameUpdate(() => {
 *   const center = project(root.position);
 *   const edge = project({
 *     x: root.position.x + RADIUS,
 *     y: root.position.y,
 *     z: root.position.z,
 *   });
 *   const screenRadius = Math.abs(edge.x - center.x);
 * });
 * ```
 */
export function useScreenProjection(): (position: WorldPoint) => ScreenPoint {
    const { camera, renderer } = useThreeContext();

    const _vec = new THREE.Vector3();
    const _result: ScreenPoint = { x: 0, y: 0, depth: 0, visible: false };

    return (position: WorldPoint): ScreenPoint => {
        _vec.set(position.x, position.y, position.z);
        _vec.project(camera as THREE.PerspectiveCamera);

        const halfWidth = renderer.domElement.clientWidth / 2;
        const halfHeight = renderer.domElement.clientHeight / 2;

        _result.x = _vec.x * halfWidth + halfWidth;
        _result.y = -_vec.y * halfHeight + halfHeight;
        _result.depth = (_vec.z + 1) / 2;
        _result.visible = _vec.z >= -1 && _vec.z <= 1;

        return _result;
    };
}
