import type { Object3D } from 'three';
import type { ThreeViewContext } from '../utils/types';
import { getTransform } from '@pulse-ts/core';

/** Apply core Transform's interpolated *local* TRS to a THREE.Object3D. */
export function applyLocalTRSToObject3D(node: object, object: Object3D, ctx: ThreeViewContext): void {
    const t = getTransform(node);
    const { position, rotation, scale } = ctx.alpha > 0 ? t.interpolateLocal(ctx.alpha) : { position: t.localPosition, rotation: t.localRotation, scale: t.localScale };

    object.position.set(position.x, position.y, position.z);
    object.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    object.scale.set(scale.x, scale.y, scale.z);
}