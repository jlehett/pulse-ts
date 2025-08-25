import type { Object3D } from 'three';
import type { ThreeViewContext } from '../utils/types';
import { getTransform } from '@pulse-ts/core';

/**
 * Apply core Transform's interpolated *local* TRS to a THREE.Object3D.
 * @param node The node to get the transform from.
 * @param object The object to apply the transform to.
 * @param ctx The context to use for the transform.
 */
export function applyLocalTRSToObject3D(
    node: object,
    object: Object3D,
    ctx: ThreeViewContext,
): void {
    const t = getTransform(node);
    const { position, rotation, scale } =
        ctx.alpha > 0
            ? t.interpolateLocal(ctx.alpha)
            : {
                  position: t.localPosition,
                  rotation: t.localRotation,
                  scale: t.localScale,
              };

    object.position.set(position.x, position.y, position.z);
    object.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    object.scale.set(scale.x, scale.y, scale.z);
}
