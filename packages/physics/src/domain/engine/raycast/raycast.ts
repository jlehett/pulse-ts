import { Vec3, getComponent, Transform, Quat } from '@pulse-ts/core';
import type { Node } from '@pulse-ts/core';
import { Collider } from '../../../public/components/Collider';
import type { RaycastHit } from '../../types';

export interface RaycastOptions {
    /** Bitmask of layers to include. Defaults to all layers. */
    mask?: number;
    /** Additional predicate to include/exclude colliders. Composed with mask. */
    filter?: (c: Collider) => boolean;
}

export function raycast(
    colliders: Iterable<Collider>,
    origin: Vec3,
    dir: Vec3,
    maxOrOpts: number | RaycastOptions = Infinity,
    legacyFilter?: (c: Collider) => boolean,
): RaycastHit | null {
    const opts: RaycastOptions =
        typeof maxOrOpts === 'number'
            ? { mask: 0xffffffff, filter: legacyFilter }
            : { mask: 0xffffffff, ...maxOrOpts };
    const maxDist = typeof maxOrOpts === 'number' ? maxOrOpts : Infinity;
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
        if ((opts.mask! & c.layer) === 0) continue;
        if (opts.filter && !opts.filter(c)) continue;
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
        } else if (c.kind === 'plane') {
            // Ray-plane
            const pn = Quat.rotateVector(
                trs.rotation,
                c.planeNormal.clone().normalize(),
            );
            const off = Quat.rotateVector(trs.rotation, c.offset.clone());
            const point = new Vec3(
                trs.position.x + off.x,
                trs.position.y + off.y,
                trs.position.z + off.z,
            );
            const denom = pn.x * dx + pn.y * dy + pn.z * dz;
            if (Math.abs(denom) > 1e-8) {
                const tHit =
                    ((point.x - ox) * pn.x +
                        (point.y - oy) * pn.y +
                        (point.z - oz) * pn.z) /
                    denom;
                if (tHit >= 0 && tHit <= maxDist) {
                    hitDist = tHit;
                    n = { x: pn.x, y: pn.y, z: pn.z };
                }
            }
        } else if (c.kind === 'capsule') {
            // Ray-capsule: test cylinder (finite) and spherical caps
            // Compute world segment for capsule (along local Y)
            const up = Quat.rotateVector(trs.rotation, new Vec3(0, 1, 0));
            const a = new Vec3(
                center.x + up.x * c.capHalfHeight,
                center.y + up.y * c.capHalfHeight,
                center.z + up.z * c.capHalfHeight,
            );
            const b = new Vec3(
                center.x - up.x * c.capHalfHeight,
                center.y - up.y * c.capHalfHeight,
                center.z - up.z * c.capHalfHeight,
            );
            const r = c.capRadius;
            // Ray-sphere helper
            const raySphere = (
                cx: number,
                cy: number,
                cz: number,
                rr: number,
            ) => {
                const lx = ox - cx,
                    ly = oy - cy,
                    lz = oz - cz;
                const bq = lx * dx + ly * dy + lz * dz;
                const cterm = lx * lx + ly * ly + lz * lz - rr * rr;
                const disc = bq * bq - cterm;
                if (disc < 0) return null as number | null;
                const t0 = -bq - Math.sqrt(disc);
                const t1 = -bq + Math.sqrt(disc);
                return t0 >= 0 ? t0 : t1 >= 0 ? t1 : null;
            };
            // Cylinder intersection (finite around axis AB)
            const abx = b.x - a.x,
                aby = b.y - a.y,
                abz = b.z - a.z;
            const ab2 = abx * abx + aby * aby + abz * abz || 1e-8;
            const projN = (dx * abx + dy * aby + dz * abz) / ab2;
            const projM =
                ((ox - a.x) * abx + (oy - a.y) * aby + (oz - a.z) * abz) / ab2;
            const ndx = dx - projN * abx,
                ndy = dy - projN * aby,
                ndz = dz - projN * abz;
            const mdx = ox - a.x - projM * abx,
                mdy = oy - a.y - projM * aby,
                mdz = oz - a.z - projM * abz;
            const A = ndx * ndx + ndy * ndy + ndz * ndz;
            const B = mdx * ndx + mdy * ndy + mdz * ndz;
            const C = mdx * mdx + mdy * mdy + mdz * mdz - r * r;
            let tCyl: number | null = null;
            if (A > 1e-8) {
                const disc = B * B - A * C;
                if (disc >= 0) {
                    const rt = Math.sqrt(disc);
                    const t0 = (-B - rt) / A;
                    const t1 = (-B + rt) / A;
                    const tc = t0 >= 0 ? t0 : t1 >= 0 ? t1 : null;
                    if (tc != null) {
                        // Check if hit lies within finite segment caps
                        const px = ox + dx * tc,
                            py = oy + dy * tc,
                            pz = oz + dz * tc;
                        const s =
                            ((px - a.x) * abx +
                                (py - a.y) * aby +
                                (pz - a.z) * abz) /
                            ab2;
                        if (s >= 0 && s <= 1) tCyl = tc;
                    }
                }
            }
            const tA = raySphere(a.x, a.y, a.z, r);
            const tB = raySphere(b.x, b.y, b.z, r);
            let tHit: number | null = null;
            if (tCyl != null) tHit = tCyl;
            if (tA != null && (tHit == null || tA < tHit)) tHit = tA;
            if (tB != null && (tHit == null || tB < tHit)) tHit = tB;
            if (tHit != null && tHit >= 0 && tHit <= maxDist) {
                hitDist = tHit;
                const px = ox + dx * tHit,
                    py = oy + dy * tHit,
                    pz = oz + dz * tHit;
                // normal
                let nx = 0,
                    ny = 0,
                    nz = 0;
                if (tHit === tCyl && tCyl != null) {
                    const s =
                        ((px - a.x) * abx +
                            (py - a.y) * aby +
                            (pz - a.z) * abz) /
                        ab2;
                    const qx = a.x + abx * s,
                        qy = a.y + aby * s,
                        qz = a.z + abz * s;
                    nx = px - qx;
                    ny = py - qy;
                    nz = pz - qz;
                } else {
                    // cap normal from nearest cap center
                    const dAx = px - a.x,
                        dAy = py - a.y,
                        dAz = pz - a.z;
                    const dBx = px - b.x,
                        dBy = py - b.y,
                        dBz = pz - b.z;
                    const dA2 = dAx * dAx + dAy * dAy + dAz * dAz;
                    const dB2 = dBx * dBx + dBy * dBy + dBz * dBz;
                    if (tA != null && dA2 <= dB2) {
                        nx = dAx;
                        ny = dAy;
                        nz = dAz;
                    } else {
                        nx = dBx;
                        ny = dBy;
                        nz = dBz;
                    }
                }
                const inv = 1 / Math.max(1e-8, Math.hypot(nx, ny, nz));
                n = { x: nx * inv, y: ny * inv, z: nz * inv };
            }
        } else if (c.kind === 'cylinder') {
            // Ray-cylinder: barrel (infinite cylinder intersection clamped to height)
            // + disc cap tests
            const up = Quat.rotateVector(trs.rotation, new Vec3(0, 1, 0));
            const cylR = c.cylRadius;
            const hh = c.cylHalfHeight;

            // Barrel intersection (infinite cylinder)
            const abx = up.x,
                aby = up.y,
                abz = up.z;
            // Project ray direction onto axis-perpendicular plane
            const projN = dx * abx + dy * aby + dz * abz;
            const rox = ox - center.x,
                roy = oy - center.y,
                roz = oz - center.z;
            const projM = rox * abx + roy * aby + roz * abz;
            const ndx = dx - projN * abx,
                ndy = dy - projN * aby,
                ndz = dz - projN * abz;
            const mdx = rox - projM * abx,
                mdy = roy - projM * aby,
                mdz = roz - projM * abz;
            const A = ndx * ndx + ndy * ndy + ndz * ndz;
            const B = mdx * ndx + mdy * ndy + mdz * ndz;
            const C = mdx * mdx + mdy * mdy + mdz * mdz - cylR * cylR;

            let tCyl: number | null = null;
            if (A > 1e-8) {
                const disc = B * B - A * C;
                if (disc >= 0) {
                    const rt = Math.sqrt(disc);
                    const t0 = (-B - rt) / A;
                    const t1 = (-B + rt) / A;
                    for (const tc of [t0, t1]) {
                        if (tc < 0) continue;
                        // Check if hit lies within finite height
                        const hx2 = ox + dx * tc,
                            hy2 = oy + dy * tc,
                            hz2 = oz + dz * tc;
                        const s =
                            (hx2 - center.x) * abx +
                            (hy2 - center.y) * aby +
                            (hz2 - center.z) * abz;
                        if (s >= -hh && s <= hh) {
                            tCyl = tc;
                            break; // t0 < t1, take first valid
                        }
                    }
                }
            }

            // Disc cap tests (ray-plane intersection + radius check)
            let tCapA: number | null = null;
            let tCapB: number | null = null;
            const denom = dx * abx + dy * aby + dz * abz;
            if (Math.abs(denom) > 1e-8) {
                // Top cap (+hh)
                const capAx = center.x + abx * hh;
                const capAy = center.y + aby * hh;
                const capAz = center.z + abz * hh;
                const tA =
                    ((capAx - ox) * abx +
                        (capAy - oy) * aby +
                        (capAz - oz) * abz) /
                    denom;
                if (tA >= 0) {
                    const px2 = ox + dx * tA - capAx;
                    const py2 = oy + dy * tA - capAy;
                    const pz2 = oz + dz * tA - capAz;
                    if (px2 * px2 + py2 * py2 + pz2 * pz2 <= cylR * cylR) {
                        tCapA = tA;
                    }
                }
                // Bottom cap (-hh)
                const capBx = center.x - abx * hh;
                const capBy = center.y - aby * hh;
                const capBz = center.z - abz * hh;
                const tB2 =
                    ((capBx - ox) * abx +
                        (capBy - oy) * aby +
                        (capBz - oz) * abz) /
                    denom;
                if (tB2 >= 0) {
                    const px2 = ox + dx * tB2 - capBx;
                    const py2 = oy + dy * tB2 - capBy;
                    const pz2 = oz + dz * tB2 - capBz;
                    if (px2 * px2 + py2 * py2 + pz2 * pz2 <= cylR * cylR) {
                        tCapB = tB2;
                    }
                }
            }

            // Pick closest valid hit
            let tHit: number | null = null;
            let hitType: 'barrel' | 'capA' | 'capB' = 'barrel';
            if (tCyl != null) {
                tHit = tCyl;
                hitType = 'barrel';
            }
            if (tCapA != null && (tHit == null || tCapA < tHit)) {
                tHit = tCapA;
                hitType = 'capA';
            }
            if (tCapB != null && (tHit == null || tCapB < tHit)) {
                tHit = tCapB;
                hitType = 'capB';
            }

            if (tHit != null && tHit >= 0 && tHit <= maxDist) {
                hitDist = tHit;
                const px2 = ox + dx * tHit,
                    py2 = oy + dy * tHit,
                    pz2 = oz + dz * tHit;
                let nx2 = 0,
                    ny2 = 0,
                    nz2 = 0;
                if (hitType === 'barrel') {
                    // Radial normal
                    const s =
                        (px2 - center.x) * abx +
                        (py2 - center.y) * aby +
                        (pz2 - center.z) * abz;
                    const qx = center.x + abx * s;
                    const qy = center.y + aby * s;
                    const qz = center.z + abz * s;
                    nx2 = px2 - qx;
                    ny2 = py2 - qy;
                    nz2 = pz2 - qz;
                } else if (hitType === 'capA') {
                    nx2 = abx;
                    ny2 = aby;
                    nz2 = abz;
                } else {
                    nx2 = -abx;
                    ny2 = -aby;
                    nz2 = -abz;
                }
                const inv = 1 / Math.max(1e-8, Math.hypot(nx2, ny2, nz2));
                n = { x: nx2 * inv, y: ny2 * inv, z: nz2 * inv };
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
