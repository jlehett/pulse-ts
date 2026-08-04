/**
 * Pure auto-fit math for custom unit models: computes the transform that
 * normalizes an arbitrary bounding box to construct proportions.
 */

/** Standard construct height custom models are normalized to. */
export const MODEL_TARGET_HEIGHT = 1.6;

/** Minimal axis-aligned bounding box (matches THREE.Box3's shape). */
export interface BoxLike {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
}

/** User adjustments applied on top of the auto-fit. */
export interface FitOptions {
    /** Extra uniform scale multiplier. Default 1. */
    scale?: number;
    /** Vertical offset after grounding. Default 0. */
    yOffset?: number;
}

/** Result transform: apply scale, then position, to the model wrapper. */
export interface FitTransform {
    scale: number;
    position: { x: number; y: number; z: number };
}

/**
 * Computes the uniform scale and offset that fits a model's bounding box
 * to {@link MODEL_TARGET_HEIGHT}, centers it on x/z, and rests its lowest
 * point on the ground plane (y=0).
 *
 * @param box - The model's bounding box in its local space.
 * @param opts - Optional user adjustments ({@link FitOptions}).
 * @returns Scale and position for the wrapper group.
 *
 * @example
 * fitTransform({ min: { x: -1, y: 0, z: -1 }, max: { x: 1, y: 2, z: 1 } }, {});
 * // { scale: 0.8, position: { x: 0, y: 0, z: 0 } }
 */
export function fitTransform(box: BoxLike, opts: FitOptions): FitTransform {
    const height = box.max.y - box.min.y;
    const fit = height > 1e-6 ? MODEL_TARGET_HEIGHT / height : 1;
    const scale = fit * (opts.scale ?? 1);
    const cx = (box.min.x + box.max.x) / 2;
    const cz = (box.min.z + box.max.z) / 2;
    return {
        scale,
        position: {
            x: -cx * scale,
            y: -box.min.y * scale + (opts.yOffset ?? 0),
            z: -cz * scale,
        },
    };
}
