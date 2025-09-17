import { Vec3, getComponent, Transform, Quat } from '@pulse-ts/core';
import type { Node } from '@pulse-ts/core';
import { Collider } from '../../components/Collider';
import type { RaycastHit } from '../../types';

export function raycast(
    colliders: Iterable<Collider>,
    origin: Vec3,
    dir: Vec3,
    maxDist = Infinity,
    filter?: (c: Collider) => boolean,
): RaycastHit | null {
    const ox = origin.x,
        oy = origin.y,
        oz = origin.z;
    const dx = dir.x,
        dy = dir.y,
        dz = dir.z;
    let best: {
        dist: number;
        node: Node;
        nx: number;
        ny: number;
        nz: number;
    } | null = null;
    for (const c of colliders) {
        if (filter && !filter(c)) continue;
        const t = getComponent(c.owner, Transform);
        if (!t) continue;
        const trs = t.getWorldTRS();
        const rot = trs.rotation;
        const off = Quat.rotateVector(
            rot,
            new Vec3(c.offset.x, c.offset.y, c.offset.z),
        );
        const center = new Vec3(
            trs.position.x + off.x,
            trs.position.y + off.y,
            trs.position.z + off.z,
        );
        let hitDist: number | null = null;
        let n = { x: 0, y: 0, z: 0 };
        if (c.kind === 'sphere') {
            const lx = ox - center.x,
                ly = oy - center.y,
                lz = oz - center.z;
            const b = lx * dx + ly * dy + lz * dz;
            const cterm = lx * lx + ly * ly + lz * lz - c.radius * c.radius;
            const disc = b * b - cterm;
            if (disc >= 0) {
                const t0 = -b - Math.sqrt(disc);
                const t1 = -b + Math.sqrt(disc);
                const tHit = t0 >= 0 ? t0 : t1 >= 0 ? t1 : null;
                if (tHit != null && tHit <= maxDist) {
                    hitDist = tHit;
                    const px = ox + dx * tHit - center.x;
                    const py = oy + dy * tHit - center.y;
                    const pz = oz + dz * tHit - center.z;
                    const inv = 1 / Math.max(1e-8, Math.hypot(px, py, pz));
                    n = { x: px * inv, y: py * inv, z: pz * inv };
                }
            }
        } else if (c.kind === 'box') {
            const basis = [
                Quat.rotateVector(rot, new Vec3(1, 0, 0)),
                Quat.rotateVector(rot, new Vec3(0, 1, 0)),
                Quat.rotateVector(rot, new Vec3(0, 0, 1)),
            ];
            const rel = new Vec3(ox - center.x, oy - center.y, oz - center.z);
            const ro = [
                rel.x * basis[0].x + rel.y * basis[0].y + rel.z * basis[0].z,
                rel.x * basis[1].x + rel.y * basis[1].y + rel.z * basis[1].z,
                rel.x * basis[2].x + rel.y * basis[2].y + rel.z * basis[2].z,
            ];
            const rd = [
                dx * basis[0].x + dy * basis[0].y + dz * basis[0].z,
                dx * basis[1].x + dy * basis[1].y + dz * basis[1].z,
                dx * basis[2].x + dy * basis[2].y + dz * basis[2].z,
            ];
            const half = [c.halfX, c.halfY, c.halfZ];
            let tmin = -Infinity,
                tmax = Infinity;
            let hitAxis = -1;
            for (let i = 0; i < 3; i++) {
                const invd = 1 / (rd[i] || 1e-9);
                let t1 = (-half[i] - ro[i]) * invd;
                let t2 = (half[i] - ro[i]) * invd;
                let sign = -1;
                if (t1 > t2) {
                    const tmp = t1;
                    t1 = t2;
                    t2 = tmp;
                    sign = 1;
                }
                if (t1 > tmin) {
                    tmin = t1;
                    hitAxis = i * sign;
                }
                tmax = Math.min(tmax, t2);
                if (tmin > tmax) {
                    tmin = Infinity;
                    break;
                }
            }
            if (tmin !== Infinity) {
                const tHit = tmin >= 0 ? tmin : tmax;
                if (tHit >= 0 && tHit <= maxDist) {
                    hitDist = tHit;
                    const axis = Math.abs(hitAxis);
                    const sgn = hitAxis >= 0 ? 1 : -1;
                    const ax = basis[axis];
                    n = { x: ax.x * sgn, y: ax.y * sgn, z: ax.z * sgn };
                }
            }
        }
        if (hitDist != null && (!best || hitDist < best.dist))
            best = { dist: hitDist, node: c.owner, nx: n.x, ny: n.y, nz: n.z };
    }
    if (!best) return null;
    return {
        node: best.node,
        distance: best.dist,
        point: {
            x: origin.x + dir.x * best.dist,
            y: origin.y + dir.y * best.dist,
            z: origin.z + dir.z * best.dist,
        },
        normal: { x: best.nx, y: best.ny, z: best.nz },
    };
}
