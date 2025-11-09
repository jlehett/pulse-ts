import { Vec3, getComponent, Transform, Quat } from '@pulse-ts/core';
import { Collider } from '../../../public/components/Collider';
import type { ContactConstraint } from './solver';

export type Contact = {
    nx: number;
    ny: number;
    nz: number;
    depth: number;
} | null;

export function detectCollision(a: Collider, b: Collider): Contact {
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
            new Vec3(b.offset.x, b.offset.y, b.offset.z),
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
            new Vec3(a.offset.x, a.offset.y, a.offset.z),
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
    // Specialized: box-box
    if (a.kind === 'box' && b.kind === 'box') {
        const base = obbObb(a, b);
        if (!base) return [];
        const { nx, ny, nz } = base;
        const n = new Vec3(nx, ny, nz);
        const fa = obbFrame(a);
        const fb = obbFrame(b);
        const vertsA = boxVerticesWorld(fa);
        const vertsB = boxVerticesWorld(fb);
        const eps = 1e-4;
        const insideB = (p: Vec3) => {
            const v = new Vec3(
                p.x - fb.center.x,
                p.y - fb.center.y,
                p.z - fb.center.z,
            );
            const x = v.x * fb.U0.x + v.y * fb.U0.y + v.z * fb.U0.z;
            const y = v.x * fb.U1.x + v.y * fb.U1.y + v.z * fb.U1.z;
            const z = v.x * fb.U2.x + v.y * fb.U2.y + v.z * fb.U2.z;
            return (
                Math.abs(x) <= fb.hx + eps &&
                Math.abs(y) <= fb.hy + eps &&
                Math.abs(z) <= fb.hz + eps
            );
        };
        const insideA = (p: Vec3) => {
            const v = new Vec3(
                p.x - fa.center.x,
                p.y - fa.center.y,
                p.z - fa.center.z,
            );
            const x = v.x * fa.U0.x + v.y * fa.U0.y + v.z * fa.U0.z;
            const y = v.x * fa.U1.x + v.y * fa.U1.y + v.z * fa.U1.z;
            const z = v.x * fa.U2.x + v.y * fa.U2.y + v.z * fa.U2.z;
            return (
                Math.abs(x) <= fa.hx + eps &&
                Math.abs(y) <= fa.hy + eps &&
                Math.abs(z) <= fa.hz + eps
            );
        };
        const supportB =
            Math.abs(n.x * fb.U0.x + n.y * fb.U0.y + n.z * fb.U0.z) * fb.hx +
            Math.abs(n.x * fb.U1.x + n.y * fb.U1.y + n.z * fb.U1.z) * fb.hy +
            Math.abs(n.x * fb.U2.x + n.y * fb.U2.y + n.z * fb.U2.z) * fb.hz;
        const supportA =
            Math.abs(-n.x * fa.U0.x + -n.y * fa.U0.y + -n.z * fa.U0.z) * fa.hx +
            Math.abs(-n.x * fa.U1.x + -n.y * fa.U1.y + -n.z * fa.U1.z) * fa.hy +
            Math.abs(-n.x * fa.U2.x + -n.y * fa.U2.y + -n.z * fa.U2.z) * fa.hz;
        const constraints: ContactConstraint[] = [];
        for (const v of vertsA) {
            if (!insideB(v)) continue;
            const proj =
                (v.x - fb.center.x) * n.x +
                (v.y - fb.center.y) * n.y +
                (v.z - fb.center.z) * n.z;
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
                (v.x - fa.center.x) * -n.x +
                (v.y - fa.center.y) * -n.y +
                (v.z - fa.center.z) * -n.z;
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
            // project pa and pb distances and clamp
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
        const toLocal = (v: Vec3) =>
            new Vec3(
                (v.x - fb.center.x) * fb.U0.x +
                    (v.y - fb.center.y) * fb.U0.y +
                    (v.z - fb.center.z) * fb.U0.z,
                (v.x - fb.center.x) * fb.U1.x +
                    (v.y - fb.center.y) * fb.U1.y +
                    (v.z - fb.center.z) * fb.U1.z,
                (v.x - fb.center.x) * fb.U2.x +
                    (v.y - fb.center.y) * fb.U2.y +
                    (v.z - fb.center.z) * fb.U2.z,
            );
        const sampleS = [0, 0.25, 0.5, 0.75, 1];
        const out: ContactConstraint[] = [];
        for (const s of sampleS) {
            const px = seg.a.x + (seg.b.x - seg.a.x) * s;
            const py = seg.a.y + (seg.b.y - seg.a.y) * s;
            const pz = seg.a.z + (seg.b.z - seg.a.z) * s;
            const pL = toLocal(new Vec3(px, py, pz));
            const qx = Math.min(fb.hx, Math.max(-fb.hx, pL.x));
            const qy = Math.min(fb.hy, Math.max(-fb.hy, pL.y));
            const qz = Math.min(fb.hz, Math.max(-fb.hz, pL.z));
            const dx = pL.x - qx,
                dy = pL.y - qy,
                dz = pL.z - qz;
            const d2 = dx * dx + dy * dy + dz * dz;
            if (d2 <= b.capRadius * b.capRadius) {
                // world normal
                let nx = fb.U0.x * dx + fb.U1.x * dy + fb.U2.x * dz;
                let ny = fb.U0.y * dx + fb.U1.y * dy + fb.U2.y * dz;
                let nz = fb.U0.z * dx + fb.U1.z * dy + fb.U2.z * dz;
                const len = Math.hypot(nx, ny, nz) || 1;
                nx /= len;
                ny /= len;
                nz /= len;
                const d = Math.sqrt(Math.max(1e-8, d2));
                // contact point on box surface in world
                const qWorld = new Vec3(
                    fb.center.x + fb.U0.x * qx + fb.U1.x * qy + fb.U2.x * qz,
                    fb.center.y + fb.U0.y * qx + fb.U1.y * qy + fb.U2.y * qz,
                    fb.center.z + fb.U0.z * qx + fb.U1.z * qy + fb.U2.z * qz,
                );
                out.push({
                    a,
                    b,
                    nx,
                    ny,
                    nz,
                    depth: b.capRadius - d,
                    px: qWorld.x,
                    py: qWorld.y,
                    pz: qWorld.z,
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
            for (const sz of [-1, 1]) {
                const v = new Vec3(
                    center.x + U0.x * hx * sx + U1.x * hy * sy + U2.x * hz * sz,
                    center.y + U0.y * hx * sx + U1.y * hy * sy + U2.y * hz * sz,
                    center.z + U0.z * hx * sx + U1.z * hy * sy + U2.z * hz * sz,
                );
                verts.push(v);
            }
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
    const ux = Quat.rotateVector(rot, new Vec3(1, 0, 0));
    const uy = Quat.rotateVector(rot, new Vec3(0, 1, 0));
    const uz = Quat.rotateVector(rot, new Vec3(0, 0, 1));
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
        new Vec3(a.offset.x, a.offset.y, a.offset.z),
    );
    const offB = Quat.rotateVector(
        rb,
        new Vec3(b.offset.x, b.offset.y, b.offset.z),
    );
    const ca = new Vec3(
        tra.position.x + offA.x,
        tra.position.y + offA.y,
        tra.position.z + offA.z,
    );
    const cb = new Vec3(
        trb.position.x + offB.x,
        trb.position.y + offB.y,
        trb.position.z + offB.z,
    );
    const A0 = Quat.rotateVector(ra, new Vec3(1, 0, 0));
    const A1 = Quat.rotateVector(ra, new Vec3(0, 1, 0));
    const A2 = Quat.rotateVector(ra, new Vec3(0, 0, 1));
    const B0 = Quat.rotateVector(rb, new Vec3(1, 0, 0));
    const B1 = Quat.rotateVector(rb, new Vec3(0, 1, 0));
    const B2 = Quat.rotateVector(rb, new Vec3(0, 0, 1));
    const T = new Vec3(cb.x - ca.x, cb.y - ca.y, cb.z - ca.z);
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
    let sepNormal = new Vec3(0, 0, 0);
    const axes = [
        A0,
        A1,
        A2,
        B0,
        B1,
        B2,
        cross(A0, B0),
        cross(A0, B1),
        cross(A0, B2),
        cross(A1, B0),
        cross(A1, B1),
        cross(A1, B2),
        cross(A2, B0),
        cross(A2, B1),
        cross(A2, B2),
    ];
    const dotT = (L: Vec3) => Math.abs(T.x * L.x + T.y * L.y + T.z * L.z);
    for (const L of axes) {
        const len = Math.hypot(L.x, L.y, L.z);
        if (len < 1e-6) continue;
        const n = new Vec3(L.x / len, L.y / len, L.z / len);
        const raProj = proj(A0, A1, A2, a.halfX, a.halfY, a.halfZ, n);
        const rbProj = proj(B0, B1, B2, b.halfX, b.halfY, b.halfZ, n);
        const dist = dotT(n);
        const overlap = raProj + rbProj - dist;
        if (overlap <= 0) return null;
        if (overlap < minOverlap) {
            minOverlap = overlap;
            sepNormal = n;
            const dir =
                (cb.x - ca.x) * n.x + (cb.y - ca.y) * n.y + (cb.z - ca.z) * n.z;
            if (dir < 0) sepNormal.set(-n.x, -n.y, -n.z);
        }
    }
    return {
        nx: sepNormal.x,
        ny: sepNormal.y,
        nz: sepNormal.z,
        depth: minOverlap,
    };
}

function cross(a: Vec3, b: Vec3): Vec3 {
    return new Vec3(
        a.y * b.z - a.z * b.y,
        a.z * b.x - a.x * b.z,
        a.x * b.y - a.y * b.x,
    );
}

function planeWorld(c: Collider): { p: Vec3; n: Vec3 } {
    const t = getComponent(c.owner, Transform)!;
    const trs = t.getWorldTRS();
    const n = Quat.rotateVector(
        trs.rotation,
        c.planeNormal.clone().normalize(),
    );
    const off = Quat.rotateVector(trs.rotation, c.offset.clone());
    const p = new Vec3(
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
    const c = new Vec3(trs.position.x, trs.position.y, trs.position.z);
    const r = trs.rotation;
    const A0 = Quat.rotateVector(r, new Vec3(1, 0, 0));
    const A1 = Quat.rotateVector(r, new Vec3(0, 1, 0));
    const A2 = Quat.rotateVector(r, new Vec3(0, 0, 1));
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
    const up = Quat.rotateVector(trs.rotation, new Vec3(0, 1, 0));
    const off = Quat.rotateVector(trs.rotation, c.offset.clone());
    const center = new Vec3(
        trs.position.x + off.x,
        trs.position.y + off.y,
        trs.position.z + off.z,
    );
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
    return { a, b, r: c.capRadius };
}

function closestPointOnSegment(p: Vec3, a: Vec3, b: Vec3): Vec3 {
    const abx = b.x - a.x,
        aby = b.y - a.y,
        abz = b.z - a.z;
    const apx = p.x - a.x,
        apy = p.y - a.y,
        apz = p.z - a.z;
    const ab2 = abx * abx + aby * aby + abz * abz || 1e-8;
    let t = (apx * abx + apy * aby + apz * abz) / ab2;
    t = Math.max(0, Math.min(1, t));
    return new Vec3(a.x + abx * t, a.y + aby * t, a.z + abz * t);
}

function capsuleSphere(
    cap: Collider,
    sphereCenter: { x: number; y: number; z: number },
    sphereRadius: number,
): Contact {
    const { a, b, r } = capsuleWorldSegment(cap);
    const p = new Vec3(sphereCenter.x, sphereCenter.y, sphereCenter.z);
    const q = closestPointOnSegment(p, a, b);
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
    const off = Quat.rotateVector(r, box.offset.clone());
    const center = new Vec3(
        trs.position.x + off.x,
        trs.position.y + off.y,
        trs.position.z + off.z,
    );
    const U0 = Quat.rotateVector(r, new Vec3(1, 0, 0));
    const U1 = Quat.rotateVector(r, new Vec3(0, 1, 0));
    const U2 = Quat.rotateVector(r, new Vec3(0, 0, 1));
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
    const d = new Vec3(b.x - a.x, b.y - a.y, b.z - a.z);
    const candidates: number[] = [0, 1];
    for (const [ai, di, h] of [
        [a.x, d.x, hx],
        [a.y, d.y, hy],
        [a.z, d.z, hz],
    ] as Array<[number, number, number]>) {
        if (Math.abs(di) > 1e-8) {
            const s1 = (-h - ai) / di;
            const s2 = (h - ai) / di;
            if (s1 >= 0 && s1 <= 1) candidates.push(s1);
            if (s2 >= 0 && s2 <= 1) candidates.push(s2);
        }
    }
    for (let i = 1; i < 10; i++) candidates.push(i / 10);
    let best = {
        p: a.clone(),
        q: new Vec3(
            clamp(a.x, -hx, hx),
            clamp(a.y, -hy, hy),
            clamp(a.z, -hz, hz),
        ),
        s: 0,
        dist2: Infinity,
    };
    candidates.sort((x, y) => x - y);
    for (let i = 0; i < candidates.length - 1; i++) {
        const sL = candidates[i]!;
        const sR = candidates[i + 1]!;
        const sm = (sL + sR) * 0.5;
        const testS = [sL, sm, sR];
        for (const s of testS) {
            const px = a.x + d.x * s,
                py = a.y + d.y * s,
                pz = a.z + d.z * s;
            const qx = clamp(px, -hx, hx),
                qy = clamp(py, -hy, hy),
                qz = clamp(pz, -hz, hz);
            const dx = px - qx,
                dy = py - qy,
                dz = pz - qz;
            const dist2 = dx * dx + dy * dy + dz * dz;
            if (dist2 < best.dist2)
                best = {
                    p: new Vec3(px, py, pz),
                    q: new Vec3(qx, qy, qz),
                    s,
                    dist2,
                };
        }
    }
    return best;
}

export function capsuleObb(cap: Collider, box: Collider): Contact {
    const { center, U0, U1, U2, hx, hy, hz } = obbFrame(box);
    const seg = capsuleWorldSegment(cap);
    const toLocal = (v: Vec3) =>
        new Vec3(
            (v.x - center.x) * U0.x +
                (v.y - center.y) * U0.y +
                (v.z - center.z) * U0.z,
            (v.x - center.x) * U1.x +
                (v.y - center.y) * U1.y +
                (v.z - center.z) * U1.z,
            (v.x - center.x) * U2.x +
                (v.y - center.y) * U2.y +
                (v.z - center.z) * U2.z,
        );
    const aL = toLocal(seg.a);
    const bL = toLocal(seg.b);
    const best = closestPointSegmentAABBLocal(aL, bL, hx, hy, hz);
    if (best.dist2 > cap.capRadius * cap.capRadius) return null;
    const nL = new Vec3(
        best.p.x - best.q.x,
        best.p.y - best.q.y,
        best.p.z - best.q.z,
    );
    let nx = U0.x * nL.x + U1.x * nL.y + U2.x * nL.z;
    let ny = U0.y * nL.x + U1.y * nL.y + U2.y * nL.z;
    let nz = U0.z * nL.x + U1.z * nL.y + U2.z * nL.z;
    const len = Math.hypot(nx, ny, nz) || 1;
    nx /= len;
    ny /= len;
    nz /= len;
    const d = Math.sqrt(best.dist2);
    return { nx, ny, nz, depth: cap.capRadius - d };
}

export function capsuleCapsule(a: Collider, b: Collider): Contact {
    const sa = capsuleWorldSegment(a);
    const sb = capsuleWorldSegment(b);
    // Based on closest points between segments
    const da = new Vec3(sa.b.x - sa.a.x, sa.b.y - sa.a.y, sa.b.z - sa.a.z);
    const db = new Vec3(sb.b.x - sb.a.x, sb.b.y - sb.a.y, sb.b.z - sb.a.z);
    const r = new Vec3(sa.a.x - sb.a.x, sa.a.y - sb.a.y, sa.a.z - sb.a.z);
    const aLen2 = da.x * da.x + da.y * da.y + da.z * da.z || 1e-8;
    const bLen2 = db.x * db.x + db.y * db.y + db.z * db.z || 1e-8;
    const aDotb = da.x * db.x + da.y * db.y + da.z * db.z;
    const aDotr = da.x * r.x + da.y * r.y + da.z * r.z;
    const bDotr = db.x * r.x + db.y * r.y + db.z * r.z;
    const denom = aLen2 * bLen2 - aDotb * aDotb || 1e-8;
    let s = (aDotb * bDotr - bLen2 * aDotr) / denom;
    s = Math.max(0, Math.min(1, s));
    let t = (aDotb * s + bDotr) / bLen2;
    t = Math.max(0, Math.min(1, t));
    // refine s with clamped t
    s = (aDotb * t - aDotr) / aLen2;
    s = Math.max(0, Math.min(1, s));
    const pa = new Vec3(
        sa.a.x + da.x * s,
        sa.a.y + da.y * s,
        sa.a.z + da.z * s,
    );
    const pb = new Vec3(
        sb.a.x + db.x * t,
        sb.a.y + db.y * t,
        sb.a.z + db.z * t,
    );
    const vx = pb.x - pa.x,
        vy = pb.y - pa.y,
        vz = pb.z - pa.z;
    const d2 = vx * vx + vy * vy + vz * vz;
    const rr = a.capRadius + b.capRadius;
    if (d2 >= rr * rr) return null;
    const d = Math.sqrt(Math.max(1e-8, d2));
    const nx = vx / d,
        ny = vy / d,
        nz = vz / d;
    return { nx, ny, nz, depth: rr - d };
}
