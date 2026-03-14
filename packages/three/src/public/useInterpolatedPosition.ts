import * as THREE from 'three';
import {
    useWorld,
    useFixedEarly,
    useFrameUpdate,
    Transform,
} from '@pulse-ts/core';

// ---------------------------------------------------------------------------
// Option types
// ---------------------------------------------------------------------------

/** Options for {@link useInterpolatedPosition}. */
export interface InterpolatedPositionOptions {
    /**
     * Override the alpha source. When omitted, uses `world.getAmbientAlpha()`.
     *
     * @default world.getAmbientAlpha()
     */
    getAlpha?: () => number;

    /**
     * When this returns `true`, skip interpolation and snap the target
     * directly to the source position. Useful for teleports and round resets
     * where interpolating between the old and new position would cause a
     * visible sweep.
     */
    snap?: () => boolean;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Smoothly interpolates a Three.js `Object3D` position from a `Transform`
 * component across fixed-step boundaries. Snapshots the transform each
 * fixed tick and applies alpha-blended interpolation each render frame.
 *
 * Eliminates the most common fixed-to-frame interpolation boilerplate —
 * a single call replaces ~15 lines of manual `useFixedEarly` +
 * `useFrameUpdate` interpolation code.
 *
 * @param source - The ECS `Transform` component (updated in fixed step).
 * @param target - The Three.js `Object3D` whose position is driven.
 * @param options - Optional configuration for alpha source and snap behavior.
 *
 * @example
 * ```ts
 * import { useComponent, Transform } from '@pulse-ts/core';
 * import { useMesh, useInterpolatedPosition } from '@pulse-ts/three';
 *
 * function LocalPlayerNode() {
 *   const transform = useComponent(Transform);
 *   const { root } = useMesh('sphere', { radius: 0.5 });
 *
 *   // One line replaces 15 lines of manual interpolation
 *   useInterpolatedPosition(transform, root);
 * }
 * ```
 *
 * @example
 * ```ts
 * // With snap override (e.g., teleport on round reset)
 * let shouldSnap = false;
 *
 * useInterpolatedPosition(transform, root, {
 *   snap: () => {
 *     if (shouldSnap) { shouldSnap = false; return true; }
 *     return false;
 *   },
 * });
 * ```
 */
export function useInterpolatedPosition(
    source: Transform,
    target: THREE.Object3D,
    options: InterpolatedPositionOptions = {},
): void {
    const world = useWorld();
    const { getAlpha, snap } = options;

    let prevX = source.localPosition.x;
    let prevY = source.localPosition.y;
    let prevZ = source.localPosition.z;

    useFixedEarly(() => {
        prevX = source.localPosition.x;
        prevY = source.localPosition.y;
        prevZ = source.localPosition.z;
    });

    useFrameUpdate(() => {
        const cur = source.localPosition;

        if (snap?.()) {
            prevX = cur.x;
            prevY = cur.y;
            prevZ = cur.z;
            target.position.set(cur.x, cur.y, cur.z);
            return;
        }

        const alpha = getAlpha ? getAlpha() : world.getAmbientAlpha();
        target.position.set(
            prevX + (cur.x - prevX) * alpha,
            prevY + (cur.y - prevY) * alpha,
            prevZ + (cur.z - prevZ) * alpha,
        );
    });
}
