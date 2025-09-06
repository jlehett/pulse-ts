import { Service } from '@pulse-ts/core';
import type { Node } from '@pulse-ts/core';
import { getComponent, attachComponent } from '@pulse-ts/core';
import { Transform } from '@pulse-ts/core';
import { StableId } from '@pulse-ts/core';
import { Vec3 } from '@pulse-ts/core';
import { Quat } from '@pulse-ts/core';

type Target = {
    p?: { x: number; y: number; z: number };
    r?: { x: number; y: number; z: number; w: number };
    s?: { x: number; y: number; z: number };
};

type Entry = {
    node: Node;
    trans: Transform;
    /** Current target from network. */
    target: Target;
    /** Optional immediate apply threshold squared (e.g., snap if far). */
    snapDistSq: number;
    /** Smoothing rate constant (per second). */
    lambda: number;
};

/**
 * Maintains target TRS for remote entities and smoothly interpolates toward them.
 */
export class InterpolationService extends Service {
    private m = new Map<string, Entry>();

    /**
     * Registers or updates the interpolation entry for an entity id.
     * @param node The node to drive (must have Transform).
     * @param opts Options including smoothing lambda and snap distance.
     */
    register(
        node: Node,
        opts?: { id?: string; lambda?: number; snapDist?: number },
    ) {
        const id = (opts?.id ?? attachComponent(node, StableId).id).trim();
        if (!id)
            throw new Error(
                'InterpolationService.register requires StableId.id or opts.id',
            );
        let e = this.m.get(id);
        const trans =
            getComponent(node, Transform) ?? attachComponent(node, Transform);
        if (!e) {
            e = {
                node,
                trans,
                target: {},
                lambda: Math.max(0, opts?.lambda ?? 12),
                snapDistSq: Math.max(0, (opts?.snapDist ?? 5) ** 2),
            };
            this.m.set(id, e);
        } else {
            e.node = node;
            e.trans = trans;
            if (opts?.lambda !== undefined) e.lambda = Math.max(0, opts.lambda);
            if (opts?.snapDist !== undefined)
                e.snapDistSq = Math.max(0, opts.snapDist ** 2);
        }
        return id;
    }

    /**
     * Updates the target for an entity's transform.
     */
    setTarget(id: string, patch: Target) {
        const e = this.m.get(id);
        if (!e) return;
        e.target = { ...e.target, ...patch };
    }

    /**
     * Steps interpolation toward targets for all registered entities.
     * @param dt Delta time in seconds.
     */
    tick(dt: number) {
        if (dt <= 0) return;
        for (const [, e] of this.m) this.step(e, dt);
    }

    private step(e: Entry, dt: number) {
        const t = e.trans;
        const target = e.target;
        const rate = 1 - Math.exp(-e.lambda * dt);

        if (target.p) {
            // snap if far
            const dx = target.p.x - t.localPosition.x;
            const dy = target.p.y - t.localPosition.y;
            const dz = target.p.z - t.localPosition.z;
            const distSq = dx * dx + dy * dy + dz * dz;
            if (distSq > e.snapDistSq) {
                t.localPosition.set(target.p.x, target.p.y, target.p.z);
            } else {
                t.localPosition.set(
                    t.localPosition.x + dx * rate,
                    t.localPosition.y + dy * rate,
                    t.localPosition.z + dz * rate,
                );
            }
        }
        if (target.r) {
            const cur = t.localRotation;
            const trg = new Quat(
                target.r.x,
                target.r.y,
                target.r.z,
                target.r.w,
            );
            Quat.slerpInto(cur, trg, rate, cur);
        }
        if (target.s) {
            t.localScale.set(
                t.localScale.x + (target.s.x - t.localScale.x) * rate,
                t.localScale.y + (target.s.y - t.localScale.y) * rate,
                t.localScale.z + (target.s.z - t.localScale.z) * rate,
            );
        }
    }
}
