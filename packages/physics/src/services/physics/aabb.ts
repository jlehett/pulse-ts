import { Vec3, getComponent, Transform, Quat } from '@pulse-ts/core';
import { Collider } from '../../components/Collider';

export function computeAABB(c: Collider): { min: Vec3; max: Vec3 } | null {
    const t = getComponent(c.owner, Transform);
    if (!t) return null;
    const trs = t.getWorldTRS();
    const p = trs.position;
    const r = trs.rotation;
    const off = new Vec3(c.offset.x, c.offset.y, c.offset.z);
    const roff = Quat.rotateVector(r, off);
    const cx = p.x + roff.x;
    const cy = p.y + roff.y;
    const cz = p.z + roff.z;
    if (c.kind === 'sphere') {
        const sr = c.radius;
        return {
            min: new Vec3(cx - sr, cy - sr, cz - sr),
            max: new Vec3(cx + sr, cy + sr, cz + sr),
        };
    }
    if (c.kind === 'box') {
        const ax = Quat.rotateVector(r, new Vec3(c.halfX, 0, 0));
        const ay = Quat.rotateVector(r, new Vec3(0, c.halfY, 0));
        const az = Quat.rotateVector(r, new Vec3(0, 0, c.halfZ));
        const ex = Math.abs(ax.x) + Math.abs(ay.x) + Math.abs(az.x);
        const ey = Math.abs(ax.y) + Math.abs(ay.y) + Math.abs(az.y);
        const ez = Math.abs(ax.z) + Math.abs(ay.z) + Math.abs(az.z);
        return {
            min: new Vec3(cx - ex, cy - ey, cz - ez),
            max: new Vec3(cx + ex, cy + ey, cz + ez),
        };
    }
    if (c.kind === 'capsule') {
        const up = Quat.rotateVector(r, new Vec3(0, 1, 0));
        const ex = Math.abs(up.x) * c.capHalfHeight + c.capRadius;
        const ey = Math.abs(up.y) * c.capHalfHeight + c.capRadius;
        const ez = Math.abs(up.z) * c.capHalfHeight + c.capRadius;
        return {
            min: new Vec3(cx - ex, cy - ey, cz - ez),
            max: new Vec3(cx + ex, cy + ey, cz + ez),
        };
    }
    if (c.kind === 'plane') {
        // Infinite plane: do not include in broadphase buckets
        return null;
    }
    return null;
}
