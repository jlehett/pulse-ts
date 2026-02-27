import { Vec3, getComponent, Transform, Quat } from '@pulse-ts/core';
import { Collider } from '../../../public/components/Collider';
import type { ContactConstraint } from './solver';
import { sv3, resetPool } from './scratch';

export type Contact = {
    nx: number;
    ny: number;
    nz: number;
    depth: number;
} | null;

// Module-level unit-axis constants — passed as read-only inputs to
// Quat.rotateVector throughout this module; never mutated.
const UNIT_X = new Vec3(1, 0, 0);
const UNIT_Y = new Vec3(0, 1, 0);
const UNIT_Z = new Vec3(0, 0, 1);

export function detectCollision(a: Collider, b: Collider): Contact {
    resetPool();
    const ta = getComponent(a.owner, Transform);
    const tb = getComponent(b.owner, Transform);
    if (!ta || !tb) return null;
    const pa = ta.getWorldTRS().position;
    const pb = tb.getWorldTRS().position;
    const ax = pa.x + a.offset.x;
    const ay = pa.y + a.offset.y;
    const az = pa.z + a.offset.z;
    const bx = pb.x + b.offset.x;
    const by = pb.y + b.offset.y;
    const bz = pb.z + b.offset.z;
    if (a.kind === 'sphere' && b.kind === 'sphere')
        return sphereSphere(ax, ay, az, a.radius, bx, by, bz, b.radius);
    // plane combinations
    if (a.kind === 'sphere' && b.kind === 'plane')
        return spherePlane(ax, ay, az, a.radius, b);
    if (a.kind === 'plane' && b.kind === 'sphere') {
        const res = spherePlane(bx, by, bz, b.radius, a);
        return res
            ? { nx: -res.nx, ny: -res.ny, nz: -res.nz, depth: res.depth }
            : null;
    }
    const wbA = ta.getWorldTRS();
    const wbB = tb.getWorldTRS();
    if (a.kind === 'sphere' && b.kind === 'box') {
        const offB = Quat.rotateVector(
            wbB.rotation,
            sv3(b.offset.x, b.offset.y, b.offset.z),
            sv3(),
        );
        const bc = {
            x: wbB.position.x + offB.x,
            y: wbB.position.y + offB.y,
            z: wbB.position.z + offB.z,
        };
        const res = sphereOBB(ax, ay, az, a.radius, bc, wbB.rotation, b);
        if (!res) return null;
        return { nx: -res.nx, ny: -res.ny, nz: -res.nz, depth: res.depth };
    }
    if (a.kind === 'box' && b.kind === 'sphere') {
        const offA = Quat.rotateVector(
            wbA.rotation,
            sv3(a.offset.x, a.offset.y, a.offset.z),
            sv3(),
        );
        const ac = {
            x: wbA.position.x + offA.x,
            y: wbA.position.y + offA.y,
            z: wbA.position.z + offA.z,
        };
        const res = sphereOBB(bx, by, bz, b.radius, ac, wbA.rotation, a);
        if (!res) return null;
        return { nx: res.nx, ny: res.ny, nz: res.nz, depth: res.depth };
    }
    if (a.kind === 'box' && b.kind === 'box') return obbObb(a, b);
    if (a.kind === 'box' && b.kind === 'plane') return obbPlane(a, b);
    if (a.kind === 'plane' && b.kind === 'box') {
        const res = obbPlane(b, a);
        return res
            ? { nx: -res.nx, ny: -res.ny, nz: -res.nz, depth: res.depth }
            : null;
    }
    // capsule combos
    if (a.kind === 'capsule' && b.kind === 'sphere')
        return capsuleSphere(a, { x: bx, y: by, z: bz }, b.radius);
    if (a.kind === 'sphere' && b.kind === 'capsule') {
        const res = capsuleSphere(b, { x: ax, y: ay, z: az }, a.radius);
        return res
            ? { nx: -res.nx, ny: -res.ny, nz: -res.nz, depth: res.depth }
            : null;
    }
    if (a.kind === 'capsule' && b.kind === 'plane') return capsulePlane(a, b);
    if (a.kind === 'plane' && b.kind === 'capsule') {
        const res = capsulePlane(b, a);
        return res
            ? { nx: -res.nx, ny: -res.ny, nz: -res.nz, depth: res.depth }
            : null;
    }
    return null;
}

/**
 * Builds a small manifold (up to 4 points) of contact constraints for a pair.
 * Falls back to a single-point contact when a specialized manifold is not implemented.
 */
export function detectManifold(a: Collider, b: Collider): ContactConstraint[] {
    resetPool();
    // Specialized: box-box
    if (a.kind === 'box' && b.kind === 'box') {
        const base = obbObb(a, b);
        if (!base) return [];
        const { nx, ny, nz } = base;
        const fa = obbFrame(a);
        const fb = obbFrame(b);
        const vertsA = boxVerticesWorld(fa);
        const vertsB = boxVerticesWorld(fb);
        const eps = 1e-4;
        // Inline inside-B/A tests with scalar math — no Vec3 allocation per vertex.
        const insideB = (p: Vec3) => {
            const vx = p.x - fb.center.x;
            const vy = p.y - fb.center.y;
            const vz = p.z - fb.center.z;
            return (
                Math.abs(vx * fb.U0.x + vy * fb.U0.y + vz * fb.U0.z) <=
                    fb.hx + eps &&
                Math.abs(vx * fb.U1.x + vy * fb.U1.y + vz * fb.U1.z) <=
                    fb.hy + eps &&
                Math.abs(vx * fb.U2.x + vy * fb.U2.y + vz * fb.U2.z) <=
                    fb.hz + eps
            );
        };
        const insideA = (p: Vec3) => {
            const vx = p.x - fa.center.x;
            const vy = p.y - fa.center.y;
            const vz = p.z - fa.center.z;
            return (
                Math.abs(vx * fa.U0.x + vy * fa.U0.y + vz * fa.U0.z) <=
                    fa.hx + eps &&
                Math.abs(vx * fa.U1.x + vy * fa.U1.y + vz * fa.U1.z) <=
                    fa.hy + eps &&
                Math.abs(vx * fa.U2.x + vy * fa.U2.y + vz * fa.U2.z) <=
                    fa.hz + eps
            );
        };
        const supportB =
            Math.abs(nx * fb.U0.x + ny * fb.U0.y + nz * fb.U0.z) * fb.hx +
            Math.abs(nx * fb.U1.x + ny * fb.U1.y + nz * fb.U1.z) * fb.hy +
            Math.abs(nx * fb.U2.x + ny * fb.U2.y + nz * fb.U2.z) * fb.hz;
        const supportA =
            Math.abs(-nx * fa.U0.x + -ny * fa.U0.y + -nz * fa.U0.z) * fa.hx +
            Math.abs(-nx * fa.U1.x + -ny * fa.U1.y + -nz * fa.U1.z) * fa.hy +
            Math.abs(-nx * fa.U2.x + -ny * fa.U2.y + -nz * fa.U2.z) * fa.hz;
        const constraints: ContactConstraint[] = [];
        for (const v of vertsA) {
            if (!insideB(v)) continue;
            const proj =
                (v.x - fb.center.x) * nx +
                (v.y - fb.center.y) * ny +
                (v.z - fb.center.z) * nz;
            const depth = supportB - proj;
            if (depth > eps)
                constraints.push({
                    a,
                    b,
                    nx,
                    ny,
                    nz,
                    depth,
                    px: v.x,
                    py: v.y,
                    pz: v.z,
                });
        }
        for (const v of vertsB) {
            if (!insideA(v)) continue;
            const proj =
                (v.x - fa.center.x) * -nx +
                (v.y - fa.center.y) * -ny +
                (v.z - fa.center.z) * -nz;
            const depth = supportA - proj;
            if (depth > eps)
                constraints.push({
                    a,
                    b,
                    nx,
                    ny,
                    nz,
                    depth,
                    px: v.x,
                    py: v.y,
                    pz: v.z,
                });
        }
        if (constraints.length === 0)
            return [{ a, b, nx, ny, nz, depth: base.depth }];
        constraints.sort((c1, c2) => c2.depth - c1.depth);
        return constraints.slice(0, 4);
    }
    // Specialized: box-plane
    if (a.kind === 'box' && b.kind === 'plane') {
        const { p, n } = planeWorld(b);
        const fb = obbFrame(a);
        const verts = boxVerticesWorld(fb);
        const constraints: ContactConstraint[] = [];
        for (const v of verts) {
            const d = (v.x - p.x) * n.x + (v.y - p.y) * n.y + (v.z - p.z) * n.z;
            if (d < 0)
                constraints.push({
                    a,
                    b,
                    nx: -n.x,
                    ny: -n.y,
                    nz: -n.z,
                    depth: -d,
                    px: v.x,
                    py: v.y,
                    pz: v.z,
                });
        }
        if (constraints.length) return constraints.slice(0, 4);
        return [];
    }
    if (a.kind === 'plane' && b.kind === 'box') {
        // flip
        const pts = detectManifold(b, a);
        return pts.map((c) => ({
            a,
            b,
            nx: -c.nx,
            ny: -c.ny,
            nz: -c.nz,
            depth: c.depth,
        }));
    }
    // Specialized: capsule-plane (up to 2 points: caps that penetrate, else closest point on segment)
    if (a.kind === 'capsule' && b.kind === 'plane') {
        const { a: pa, b: pb, r } = capsuleWorldSegment(a);
        const { p, n } = planeWorld(b);
        const dA = (pa.x - p.x) * n.x + (pa.y - p.y) * n.y + (pa.z - p.z) * n.z;
        const dB = (pb.x - p.x) * n.x + (pb.y - p.y) * n.y + (pb.z - p.z) * n.z;
        const out: ContactConstraint[] = [];
        if (dA < r)
            out.push({
                a,
                b,
                nx: -n.x,
                ny: -n.y,
                nz: -n.z,
                depth: r - dA,
                px: pa.x - n.x * r,
                py: pa.y - n.y * r,
                pz: pa.z - n.z * r,
            });
        if (dB < r)
            out.push({
                a,
                b,
                nx: -n.x,
                ny: -n.y,
                nz: -n.z,
                depth: r - dB,
                px: pb.x - n.x * r,
                py: pb.y - n.y * r,
                pz: pb.z - n.z * r,
            });
        if (out.length === 0) {
            // closest point on segment to plane
            const t =
                (dA - Math.min(dA, dB)) / Math.max(1e-8, Math.abs(dA - dB));
            const s = Math.max(0, Math.min(1, t));
            const cx = pa.x + (pb.x - pa.x) * s;
            const cy = pa.y + (pb.y - pa.y) * s;
            const cz = pa.z + (pb.z - pa.z) * s;
            const d = (cx - p.x) * n.x + (cy - p.y) * n.y + (cz - p.z) * n.z;
            if (d < r)
                out.push({
                    a,
                    b,
                    nx: -n.x,
                    ny: -n.y,
                    nz: -n.z,
                    depth: r - d,
                    px: cx - n.x * r,
                    py: cy - n.y * r,
                    pz: cz - n.z * r,
                });
        }
        return out.slice(0, 2);
    }
    if (a.kind === 'plane' && b.kind === 'capsule') {
        const pts = detectManifold(b, a);
        return pts.map((c) => ({
            a,
            b,
            nx: -c.nx,
            ny: -c.ny,
            nz: -c.nz,
            depth: c.depth,
        }));
    }
    // Specialized: box-capsule (sample along capsule segment)
    if (a.kind === 'box' && b.kind === 'capsule') {
        const fb = obbFrame(a);
        const seg = capsuleWorldSegment(b);
        const sampleS = [0, 0.25, 0.5, 0.75, 1];
        const out: ContactConstraint[] = [];
        for (const s of sampleS) {
            const px = seg.a.x + (seg.b.x - seg.a.x) * s;
            const py = seg.a.y + (seg.b.y - seg.a.y) * s;
            const pz = seg.a.z + (seg.b.z - seg.a.z) * s;
            // Inline local-space transform — no Vec3 allocation.
            const vx = px - fb.center.x;
            const vy = py - fb.center.y;
            const vz = pz - fb.center.z;
            const pLx = vx * fb.U0.x + vy * fb.U0.y + vz * fb.U0.z;
            const pLy = vx * fb.U1.x + vy * fb.U1.y + vz * fb.U1.z;
            const pLz = vx * fb.U2.x + vy * fb.U2.y + vz * fb.U2.z;
            const qx = Math.min(fb.hx, Math.max(-fb.hx, pLx));
            const qy = Math.min(fb.hy, Math.max(-fb.hy, pLy));
            const qz = Math.min(fb.hz, Math.max(-fb.hz, pLz));
            const dx = pLx - qx,
                dy = pLy - qy,
                dz = pLz - qz;
            const d2 = dx * dx + dy * dy + dz * dz;
            if (d2 <= b.capRadius * b.capRadius) {
                // World normal (transform local normal to world space).
                let nx = fb.U0.x * dx + fb.U1.x * dy + fb.U2.x * dz;
                let ny = fb.U0.y * dx + fb.U1.y * dy + fb.U2.y * dz;
                let nz = fb.U0.z * dx + fb.U1.z * dy + fb.U2.z * dz;
                const len = Math.hypot(nx, ny, nz) || 1;
                nx /= len;
                ny /= len;
                nz /= len;
                const d = Math.sqrt(Math.max(1e-8, d2));
                // Inline contact point on box surface — no Vec3 allocation.
                out.push({
                    a,
                    b,
                    nx,
                    ny,
                    nz,
                    depth: b.capRadius - d,
                    px:
                        fb.center.x +
                        fb.U0.x * qx +
                        fb.U1.x * qy +
                        fb.U2.x * qz,
                    py:
                        fb.center.y +
                        fb.U0.y * qx +
                        fb.U1.y * qy +
                        fb.U2.y * qz,
                    pz:
                        fb.center.z +
                        fb.U0.z * qx +
                        fb.U1.z * qy +
                        fb.U2.z * qz,
                });
            }
        }
        if (out.length === 0) return [];
        out.sort((c1, c2) => c2.depth - c1.depth);
        return out.slice(0, 4);
    }
    if (a.kind === 'capsule' && b.kind === 'box') {
        const pts = detectManifold(b, a);
        return pts.map((c) => ({
            a,
            b,
            nx: -c.nx,
            ny: -c.ny,
            nz: -c.nz,
            depth: c.depth,
        }));
    }
    // Fallback: single contact with approximate point at A's center
    const c = detectCollision(a, b);
    if (!c) return [];
    const ta = getComponent(a.owner, Transform);
    const p = ta?.getWorldTRS().position;
    return [{ a, b, px: p?.x, py: p?.y, pz: p?.z, ...c }];
}

function boxVerticesWorld(f: ReturnType<typeof obbFrame>): Vec3[] {
    const { center, U0, U1, U2, hx, hy, hz } = f;
    const verts: Vec3[] = [];
    for (const sx of [-1, 1])
        for (const sy of [-1, 1])
            for (const sz of [-1, 1])
                verts.push(
                    sv3(
                        center.x +
                            U0.x * hx * sx +
                            U1.x * hy * sy +
                            U2.x * hz * sz,
                        center.y +
                            U0.y * hx * sx +
                            U1.y * hy * sy +
                            U2.y * hz * sz,
                        center.z +
                            U0.z * hx * sx +
                            U1.z * hy * sy +
                            U2.z * hz * sz,
                    ),
                );
    return verts;
}

function sphereSphere(
    ax: number,
    ay: number,
    az: number,
    ar: number,
    bx: number,
    by: number,
    bz: number,
    br: number,
): Contact {
    const dx = bx - ax,
        dy = by - ay,
        dz = bz - az;
    const rs = ar + br;
    const d2 = dx * dx + dy * dy + dz * dz;
    if (d2 >= rs * rs) return null;
    const d = Math.sqrt(Math.max(1e-8, d2));
    return {
        nx: d > 0 ? dx / d : 0,
        ny: d > 0 ? dy / d : 1,
        nz: d > 0 ? dz / d : 0,
        depth: rs - d,
    };
}

function sphereOBB(
    sx: number,
    sy: number,
    sz: number,
    r: number,
    bc: { x: number; y: number; z: number },
    rot: any,
    box: Collider,
): Contact {
    const ux = Quat.rotateVector(rot, UNIT_X, sv3());
    const uy = Quat.rotateVector(rot, UNIT_Y, sv3());
    const uz = Quat.rotateVector(rot, UNIT_Z, sv3());
    const dx = sx - bc.x,
        dy = sy - bc.y,
        dz = sz - bc.z;
    const px = dx * ux.x + dy * ux.y + dz * ux.z;
    const py = dx * uy.x + dy * uy.y + dz * uy.z;
    const pz = dx * uz.x + dy * uz.y + dz * uz.z;
    const cx = Math.max(-box.halfX, Math.min(px, box.halfX));
    const cy = Math.max(-box.halfY, Math.min(py, box.halfY));
    const cz = Math.max(-box.halfZ, Math.min(pz, box.halfZ));
    const cwx = bc.x + ux.x * cx + uy.x * cy + uz.x * cz;
    const cwy = bc.y + ux.y * cx + uy.y * cy + uz.y * cz;
    const cwz = bc.z + ux.z * cx + uy.z * cy + uz.z * cz;
    const vx = sx - cwx,
        vy = sy - cwy,
        vz = sz - cwz;
    const d2 = vx * vx + vy * vy + vz * vz;
    if (d2 > r * r) return null;
    const d = Math.sqrt(Math.max(1e-8, d2));
    let nx = vx / d,
        ny = vy / d,
        nz = vz / d;
    if (d === 0) {
        const pxp = Math.min(
            Math.abs(px + box.halfX),
            Math.abs(box.halfX - px),
        );
        const pyp = Math.min(
            Math.abs(py + box.halfY),
            Math.abs(box.halfY - py),
        );
        const pzp = Math.min(
            Math.abs(pz + box.halfZ),
            Math.abs(box.halfZ - pz),
        );
        if (pxp <= pyp && pxp <= pzp) {
            const sign = px < 0 ? -1 : 1;
            nx = ux.x * sign;
            ny = ux.y * sign;
            nz = ux.z * sign;
        } else if (pyp <= pzp) {
            const sign = py < 0 ? -1 : 1;
            nx = uy.x * sign;
            ny = uy.y * sign;
            nz = uy.z * sign;
        } else {
            const sign = pz < 0 ? -1 : 1;
            nx = uz.x * sign;
            ny = uz.y * sign;
            nz = uz.z * sign;
        }
    }
    return { nx, ny, nz, depth: r - d };
}

function obbObb(a: Collider, b: Collider): Contact {
    const ta = getComponent(a.owner, Transform)!;
    const tb = getComponent(b.owner, Transform)!;
    const tra = ta.getWorldTRS();
    const trb = tb.getWorldTRS();
    const ra = tra.rotation;
    const rb = trb.rotation;
    const offA = Quat.rotateVector(
        ra,
        sv3(a.offset.x, a.offset.y, a.offset.z),
        sv3(),
    );
    const offB = Quat.rotateVector(
        rb,
        sv3(b.offset.x, b.offset.y, b.offset.z),
        sv3(),
    );
    const ca = sv3(
        tra.position.x + offA.x,
        tra.position.y + offA.y,
        tra.position.z + offA.z,
    );
    const cb = sv3(
        trb.position.x + offB.x,
        trb.position.y + offB.y,
        trb.position.z + offB.z,
    );
    const A0 = Quat.rotateVector(ra, UNIT_X, sv3());
    const A1 = Quat.rotateVector(ra, UNIT_Y, sv3());
    const A2 = Quat.rotateVector(ra, UNIT_Z, sv3());
    const B0 = Quat.rotateVector(rb, UNIT_X, sv3());
    const B1 = Quat.rotateVector(rb, UNIT_Y, sv3());
    const B2 = Quat.rotateVector(rb, UNIT_Z, sv3());
    const T = sv3(cb.x - ca.x, cb.y - ca.y, cb.z - ca.z);
    const proj = (
        u: Vec3,
        v: Vec3,
        w: Vec3,
        hx: number,
        hy: number,
        hz: number,
        L: Vec3,
    ) =>
        Math.abs(hx * (u.x * L.x + u.y * L.y + u.z * L.z)) +
        Math.abs(hy * (v.x * L.x + v.y * L.y + v.z * L.z)) +
        Math.abs(hz * (w.x * L.x + w.y * L.y + w.z * L.z));
    let minOverlap = Infinity;
    let sepNx = 0,
        sepNy = 0,
        sepNz = 0;
    const axes = [
        A0,
        A1,
        A2,
        B0,
        B1,
        B2,
        cross(A0, B0, sv3()),
        cross(A0, B1, sv3()),
        cross(A0, B2, sv3()),
        cross(A1, B0, sv3()),
        cross(A1, B1, sv3()),
        cross(A1, B2, sv3()),
        cross(A2, B0, sv3()),
        cross(A2, B1, sv3()),
        cross(A2, B2, sv3()),
    ];
    const dotT = (L: Vec3) => Math.abs(T.x * L.x + T.y * L.y + T.z * L.z);
    // Single reusable scratch for the normalised test axis — avoids one
    // pool slot per iteration (15 axes → 14 fewer allocations vs the old code).
    const _n = sv3();
    for (const L of axes) {
        const len = Math.hypot(L.x, L.y, L.z);
        if (len < 1e-6) continue;
        _n.set(L.x / len, L.y / len, L.z / len);
        const raProj = proj(A0, A1, A2, a.halfX, a.halfY, a.halfZ, _n);
        const rbProj = proj(B0, B1, B2, b.halfX, b.halfY, b.halfZ, _n);
        const dist = dotT(_n);
        const overlap = raProj + rbProj - dist;
        if (overlap <= 0) return null;
        if (overlap < minOverlap) {
            minOverlap = overlap;
            const dir =
                (cb.x - ca.x) * _n.x +
                (cb.y - ca.y) * _n.y +
                (cb.z - ca.z) * _n.z;
            if (dir < 0) {
                sepNx = -_n.x;
                sepNy = -_n.y;
                sepNz = -_n.z;
            } else {
                sepNx = _n.x;
                sepNy = _n.y;
                sepNz = _n.z;
            }
        }
    }
    return { nx: sepNx, ny: sepNy, nz: sepNz, depth: minOverlap };
}

function cross(a: Vec3, b: Vec3, out: Vec3): Vec3 {
    out.x = a.y * b.z - a.z * b.y;
    out.y = a.z * b.x - a.x * b.z;
    out.z = a.x * b.y - a.y * b.x;
    return out;
}

function planeWorld(c: Collider): { p: Vec3; n: Vec3 } {
    const t = getComponent(c.owner, Transform)!;
    const trs = t.getWorldTRS();
    const normalInput = sv3(
        c.planeNormal.x,
        c.planeNormal.y,
        c.planeNormal.z,
    ).normalize();
    const n = Quat.rotateVector(trs.rotation, normalInput, sv3());
    const off = Quat.rotateVector(
        trs.rotation,
        sv3(c.offset.x, c.offset.y, c.offset.z),
        sv3(),
    );
    const p = sv3(
        trs.position.x + off.x,
        trs.position.y + off.y,
        trs.position.z + off.z,
    );
    return { p, n };
}

function spherePlane(
    sx: number,
    sy: number,
    sz: number,
    r: number,
    plane: Collider,
): Contact {
    const { p, n } = planeWorld(plane);
    const d = (sx - p.x) * n.x + (sy - p.y) * n.y + (sz - p.z) * n.z;
    const pen = r - d;
    if (pen <= 0) return null;
    return { nx: -n.x, ny: -n.y, nz: -n.z, depth: pen };
}

function obbPlane(box: Collider, plane: Collider): Contact {
    const tb = getComponent(box.owner, Transform)!;
    const trs = tb.getWorldTRS();
    const c = sv3(trs.position.x, trs.position.y, trs.position.z);
    const r = trs.rotation;
    const A0 = Quat.rotateVector(r, UNIT_X, sv3());
    const A1 = Quat.rotateVector(r, UNIT_Y, sv3());
    const A2 = Quat.rotateVector(r, UNIT_Z, sv3());
    const { p, n } = planeWorld(plane);
    const extent =
        Math.abs(A0.x * n.x + A0.y * n.y + A0.z * n.z) * box.halfX +
        Math.abs(A1.x * n.x + A1.y * n.y + A1.z * n.z) * box.halfY +
        Math.abs(A2.x * n.x + A2.y * n.y + A2.z * n.z) * box.halfZ;
    const d = (c.x - p.x) * n.x + (c.y - p.y) * n.y + (c.z - p.z) * n.z;
    const pen = extent - d;
    if (pen <= 0) return null;
    return { nx: -n.x, ny: -n.y, nz: -n.z, depth: pen };
}

function capsuleWorldSegment(c: Collider): { a: Vec3; b: Vec3; r: number } {
    const t = getComponent(c.owner, Transform)!;
    const trs = t.getWorldTRS();
    const up = Quat.rotateVector(trs.rotation, UNIT_Y, sv3());
    const off = Quat.rotateVector(
        trs.rotation,
        sv3(c.offset.x, c.offset.y, c.offset.z),
        sv3(),
    );
    const center = sv3(
        trs.position.x + off.x,
        trs.position.y + off.y,
        trs.position.z + off.z,
    );
    const a = sv3(
        center.x + up.x * c.capHalfHeight,
        center.y + up.y * c.capHalfHeight,
        center.z + up.z * c.capHalfHeight,
    );
    const b = sv3(
        center.x - up.x * c.capHalfHeight,
        center.y - up.y * c.capHalfHeight,
        center.z - up.z * c.capHalfHeight,
    );
    return { a, b, r: c.capRadius };
}

function closestPointOnSegment(p: Vec3, a: Vec3, b: Vec3, out: Vec3): Vec3 {
    const abx = b.x - a.x,
        aby = b.y - a.y,
        abz = b.z - a.z;
    const apx = p.x - a.x,
        apy = p.y - a.y,
        apz = p.z - a.z;
    const ab2 = abx * abx + aby * aby + abz * abz || 1e-8;
    let t = (apx * abx + apy * aby + apz * abz) / ab2;
    t = Math.max(0, Math.min(1, t));
    out.x = a.x + abx * t;
    out.y = a.y + aby * t;
    out.z = a.z + abz * t;
    return out;
}

function capsuleSphere(
    cap: Collider,
    sphereCenter: { x: number; y: number; z: number },
    sphereRadius: number,
): Contact {
    const { a, b, r } = capsuleWorldSegment(cap);
    const p = sv3(sphereCenter.x, sphereCenter.y, sphereCenter.z);
    const q = closestPointOnSegment(p, a, b, sv3());
    const dx = p.x - q.x,
        dy = p.y - q.y,
        dz = p.z - q.z;
    const d2 = dx * dx + dy * dy + dz * dz;
    const rr = r + sphereRadius;
    if (d2 >= rr * rr) return null;
    const d = Math.sqrt(Math.max(1e-8, d2));
    const inv = d > 0 ? 1 / d : 1;
    return { nx: dx * inv, ny: dy * inv, nz: dz * inv, depth: rr - d };
}

function capsulePlane(cap: Collider, plane: Collider): Contact {
    const { a, b, r } = capsuleWorldSegment(cap);
    const { p, n } = planeWorld(plane);
    const da = (a.x - p.x) * n.x + (a.y - p.y) * n.y + (a.z - p.z) * n.z;
    const db = (b.x - p.x) * n.x + (b.y - p.y) * n.y + (b.z - p.z) * n.z;
    const crosses = (da <= 0 && db >= 0) || (db <= 0 && da >= 0);
    const minDist = crosses ? 0 : Math.min(Math.abs(da), Math.abs(db));
    const pen = r - minDist;
    if (pen <= 0) return null;
    return { nx: -n.x, ny: -n.y, nz: -n.z, depth: pen };
}

function obbFrame(box: Collider) {
    const t = getComponent(box.owner, Transform)!;
    const trs = t.getWorldTRS();
    const r = trs.rotation;
    const off = Quat.rotateVector(
        r,
        sv3(box.offset.x, box.offset.y, box.offset.z),
        sv3(),
    );
    const center = sv3(
        trs.position.x + off.x,
        trs.position.y + off.y,
        trs.position.z + off.z,
    );
    const U0 = Quat.rotateVector(r, UNIT_X, sv3());
    const U1 = Quat.rotateVector(r, UNIT_Y, sv3());
    const U2 = Quat.rotateVector(r, UNIT_Z, sv3());
    return { center, U0, U1, U2, hx: box.halfX, hy: box.halfY, hz: box.halfZ };
}

function clamp(x: number, min: number, max: number) {
    return x < min ? min : x > max ? max : x;
}

function closestPointSegmentAABBLocal(
    a: Vec3,
    b: Vec3,
    hx: number,
    hy: number,
    hz: number,
): { p: Vec3; q: Vec3; s: number; dist2: number } {
    const dx = b.x - a.x,
        dy = b.y - a.y,
        dz = b.z - a.z;
    const candidates: number[] = [0, 1];
    for (const [ai, di, h] of [
        [a.x, dx, hx],
        [a.y, dy, hy],
        [a.z, dz, hz],
    ] as Array<[number, number, number]>) {
        if (Math.abs(di) > 1e-8) {
            const s1 = (-h - ai) / di;
            const s2 = (h - ai) / di;
            if (s1 >= 0 && s1 <= 1) candidates.push(s1);
            if (s2 >= 0 && s2 <= 1) candidates.push(s2);
        }
    }
    for (let i = 1; i < 10; i++) candidates.push(i / 10);
    // Two reusable pool vecs — mutated in-place as we find better candidates,
    // eliminating all Vec3 allocations inside the search loop.
    const bestP = sv3();
    const bestQ = sv3();
    let bestS = 0;
    let bestDist2 = Infinity;
    candidates.sort((x, y) => x - y);
    for (let i = 0; i < candidates.length - 1; i++) {
        const sL = candidates[i]!;
        const sR = candidates[i + 1]!;
        const sm = (sL + sR) * 0.5;
        const testS = [sL, sm, sR];
        for (const s of testS) {
            const px = a.x + dx * s,
                py = a.y + dy * s,
                pz = a.z + dz * s;
            const qx = clamp(px, -hx, hx),
                qy = clamp(py, -hy, hy),
                qz = clamp(pz, -hz, hz);
            const ex = px - qx,
                ey = py - qy,
                ez = pz - qz;
            const dist2 = ex * ex + ey * ey + ez * ez;
            if (dist2 < bestDist2) {
                bestP.set(px, py, pz);
                bestQ.set(qx, qy, qz);
                bestS = s;
                bestDist2 = dist2;
            }
        }
    }
    return { p: bestP, q: bestQ, s: bestS, dist2: bestDist2 };
}

export function capsuleObb(cap: Collider, box: Collider): Contact {
    resetPool();
    const { center, U0, U1, U2, hx, hy, hz } = obbFrame(box);
    const seg = capsuleWorldSegment(cap);
    const toLocal = (v: Vec3) => {
        const vx = v.x - center.x,
            vy = v.y - center.y,
            vz = v.z - center.z;
        return sv3(
            vx * U0.x + vy * U0.y + vz * U0.z,
            vx * U1.x + vy * U1.y + vz * U1.z,
            vx * U2.x + vy * U2.y + vz * U2.z,
        );
    };
    const aL = toLocal(seg.a);
    const bL = toLocal(seg.b);
    const best = closestPointSegmentAABBLocal(aL, bL, hx, hy, hz);
    if (best.dist2 > cap.capRadius * cap.capRadius) return null;
    // Inline nL computation — no Vec3 allocation.
    const nLx = best.p.x - best.q.x;
    const nLy = best.p.y - best.q.y;
    const nLz = best.p.z - best.q.z;
    let nx = U0.x * nLx + U1.x * nLy + U2.x * nLz;
    let ny = U0.y * nLx + U1.y * nLy + U2.y * nLz;
    let nz = U0.z * nLx + U1.z * nLy + U2.z * nLz;
    const len = Math.hypot(nx, ny, nz) || 1;
    nx /= len;
    ny /= len;
    nz /= len;
    const d = Math.sqrt(best.dist2);
    return { nx, ny, nz, depth: cap.capRadius - d };
}

export function capsuleCapsule(a: Collider, b: Collider): Contact {
    resetPool();
    const sa = capsuleWorldSegment(a);
    const sb = capsuleWorldSegment(b);
    // Use scalars for direction vectors — eliminates 5 Vec3 allocations.
    const dax = sa.b.x - sa.a.x,
        day = sa.b.y - sa.a.y,
        daz = sa.b.z - sa.a.z;
    const dbx = sb.b.x - sb.a.x,
        dby = sb.b.y - sb.a.y,
        dbz = sb.b.z - sb.a.z;
    const rx = sa.a.x - sb.a.x,
        ry = sa.a.y - sb.a.y,
        rz = sa.a.z - sb.a.z;
    const aLen2 = dax * dax + day * day + daz * daz || 1e-8;
    const bLen2 = dbx * dbx + dby * dby + dbz * dbz || 1e-8;
    const aDotb = dax * dbx + day * dby + daz * dbz;
    const aDotr = dax * rx + day * ry + daz * rz;
    const bDotr = dbx * rx + dby * ry + dbz * rz;
    const denom = aLen2 * bLen2 - aDotb * aDotb || 1e-8;
    let s = (aDotb * bDotr - bLen2 * aDotr) / denom;
    s = Math.max(0, Math.min(1, s));
    let t = (aDotb * s + bDotr) / bLen2;
    t = Math.max(0, Math.min(1, t));
    // refine s with clamped t
    s = (aDotb * t - aDotr) / aLen2;
    s = Math.max(0, Math.min(1, s));
    const vx = sb.a.x + dbx * t - (sa.a.x + dax * s);
    const vy = sb.a.y + dby * t - (sa.a.y + day * s);
    const vz = sb.a.z + dbz * t - (sa.a.z + daz * s);
    const d2 = vx * vx + vy * vy + vz * vz;
    const rr = a.capRadius + b.capRadius;
    if (d2 >= rr * rr) return null;
    const d = Math.sqrt(Math.max(1e-8, d2));
    const nx = vx / d,
        ny = vy / d,
        nz = vz / d;
    return { nx, ny, nz, depth: rr - d };
}
