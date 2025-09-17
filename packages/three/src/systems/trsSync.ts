import { System, getComponent, Transform, Visibility } from '@pulse-ts/core';
import type { UpdateKind, UpdatePhase } from '@pulse-ts/core';
import { ThreeService } from '../services/Three';

/**
 * Synchronizes Node TRS into Three Object3D roots each frame before render.
 */
export class ThreeTRSSyncSystem extends System {
    static updateKind: UpdateKind = 'frame';
    static updatePhase: UpdatePhase = 'late';
    static order: number = Number.MAX_SAFE_INTEGER - 2;

    update(): void {
        if (!this.world) return;
        const svc = this.world.getService(ThreeService);
        if (!svc) return;

        const alpha = this.world.getAmbientAlpha();

        for (const [node, rec] of svc.iterateRoots()) {
            const t = getComponent(node, Transform);
            if (!t) continue;

            // Visibility from core culling (if enabled)
            if (svc.options.enableCulling) {
                const v = getComponent(node, Visibility);
                const vis = v ? v.visible : true;
                rec.root.visible = vis;
                if (!vis) continue;
            } else {
                rec.root.visible = true;
            }

            if (alpha === 0) {
                // Skip Three writes when world transform hasn't changed
                t.getWorldTRS(rec.trs, 0);
                if (rec.lastWorldVersion == t.getWorldVersion?.()) {
                    continue;
                }
                rec.lastWorldVersion = t.getWorldVersion?.() ?? -1;
                // Apply local TRS to Three (Three composes with parent)
                t.getLocalTRS(rec.trs, 0);
            } else {
                // With interpolation, always update
                t.getLocalTRS(rec.trs, alpha);
                rec.lastWorldVersion = -1;
            }

            rec.root.position.set(
                rec.trs.position.x,
                rec.trs.position.y,
                rec.trs.position.z,
            );
            rec.root.quaternion.set(
                rec.trs.rotation.x,
                rec.trs.rotation.y,
                rec.trs.rotation.z,
                rec.trs.rotation.w,
            );
            rec.root.scale.set(
                rec.trs.scale.x,
                rec.trs.scale.y,
                rec.trs.scale.z,
            );
            if (svc.options.useMatrices) {
                rec.root.updateMatrix();
                rec.root.matrixWorldNeedsUpdate = true;
            }
        }
    }
}
