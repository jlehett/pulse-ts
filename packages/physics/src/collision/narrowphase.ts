import { Vec3, getComponent, Transform, Quat } from '@pulse-ts/core';
import { Collider } from '../components/Collider';

export type NarrowphaseResult = { nx: number; ny: number; nz: number; depth: number } | null;

export function narrowphase(a: Collider, b: Collider): NarrowphaseResult {
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

    if (a.kind === 'sphere' && b.kind === 'sphere') return sphereSphere(ax, ay, az, a.radius, bx, by, bz, b.radius);
    // OBB helpers need rotated centers
    const wbA = ta.getWorldTRS();
    const wbB = tb.getWorldTRS();
    if (a.kind === 'sphere' && b.kind === 'box') {
        const offB = Quat.rotateVector(wbB.rotation, new Vec3(b.offset.x, b.offset.y, b.offset.z));
        const bc = { x: wbB.position.x + offB.x, y: wbB.position.y + offB.y, z: wbB.position.z + offB.z };
        const res = sphereOBB(ax, ay, az, a.radius, bc, wbB.rotation, b);
        if (!res) return null;
        return { nx: -res.nx, ny: -res.ny, nz: -res.nz, depth: res.depth };
    }
    if (a.kind === 'box' && b.kind === 'sphere') {
        const offA = Quat.rotateVector(wbA.rotation, new Vec3(a.offset.x, a.offset.y, a.offset.z));
        const ac = { x: wbA.position.x + offA.x, y: wbA.position.y + offA.y, z: wbA.position.z + offA.z };
        const res = sphereOBB(bx, by, bz, b.radius, ac, wbA.rotation, a);
        if (!res) return null;
        return { nx: res.nx, ny: res.ny, nz: res.nz, depth: res.depth };
    }
    if (a.kind === 'box' && b.kind === 'box') return obbObb(a, b);
    return null;
}

function sphereSphere(ax: number, ay: number, az: number, ar: number, bx: number, by: number, bz: number, br: number): NarrowphaseResult {
    const dx = bx - ax, dy = by - ay, dz = bz - az;
    const rs = ar + br;
    const d2 = dx * dx + dy * dy + dz * dz;
    if (d2 >= rs * rs) return null;
    const d = Math.sqrt(Math.max(1e-8, d2));
    return { nx: d > 0 ? dx / d : 0, ny: d > 0 ? dy / d : 1, nz: d > 0 ? dz / d : 0, depth: rs - d };
}

function sphereOBB(
    sx: number,
    sy: number,
    sz: number,
    r: number,
    bc: { x: number; y: number; z: number },
    rot: any,
    box: Collider,
): NarrowphaseResult {
    const ux = Quat.rotateVector(rot, new Vec3(1, 0, 0));
    const uy = Quat.rotateVector(rot, new Vec3(0, 1, 0));
    const uz = Quat.rotateVector(rot, new Vec3(0, 0, 1));
    const dx = sx - bc.x, dy = sy - bc.y, dz = sz - bc.z;
    const px = dx * ux.x + dy * ux.y + dz * ux.z;
    const py = dx * uy.x + dy * uy.y + dz * uy.z;
    const pz = dx * uz.x + dy * uz.y + dz * uz.z;
    const cx = Math.max(-box.halfX, Math.min(px, box.halfX));
    const cy = Math.max(-box.halfY, Math.min(py, box.halfY));
    const cz = Math.max(-box.halfZ, Math.min(pz, box.halfZ));
    const cwx = bc.x + ux.x * cx + uy.x * cy + uz.x * cz;
    const cwy = bc.y + ux.y * cx + uy.y * cy + uz.y * cz;
    const cwz = bc.z + ux.z * cx + uy.z * cy + uz.z * cz;
    const vx = sx - cwx, vy = sy - cwy, vz = sz - cwz;
    const d2 = vx * vx + vy * vy + vz * vz;
    if (d2 > r * r) return null;
    const d = Math.sqrt(Math.max(1e-8, d2));
    let nx = vx / d, ny = vy / d, nz = vz / d;
    if (d === 0) {
        const pxp = Math.min(Math.abs(px + box.halfX), Math.abs(box.halfX - px));
        const pyp = Math.min(Math.abs(py + box.halfY), Math.abs(box.halfY - py));
        const pzp = Math.min(Math.abs(pz + box.halfZ), Math.abs(box.halfZ - pz));
        if (pxp <= pyp && pxp <= pzp) {
            const sign = px < 0 ? -1 : 1;
            nx = ux.x * sign; ny = ux.y * sign; nz = ux.z * sign;
        } else if (pyp <= pzp) {
            const sign = py < 0 ? -1 : 1;
            nx = uy.x * sign; ny = uy.y * sign; nz = uy.z * sign;
        } else {
            const sign = pz < 0 ? -1 : 1;
            nx = uz.x * sign; ny = uz.y * sign; nz = uz.z * sign;
        }
    }
    return { nx, ny, nz, depth: r - d };
}

function obbObb(a: Collider, b: Collider): NarrowphaseResult {
    const ta = getComponent(a.owner, Transform)!;
    const tb = getComponent(b.owner, Transform)!;
    const tra = ta.getWorldTRS();
    const trb = tb.getWorldTRS();
    const ra = tra.rotation;
    const rb = trb.rotation;
    const offA = Quat.rotateVector(ra, new Vec3(a.offset.x, a.offset.y, a.offset.z));
    const offB = Quat.rotateVector(rb, new Vec3(b.offset.x, b.offset.y, b.offset.z));
    const ca = new Vec3(tra.position.x + offA.x, tra.position.y + offA.y, tra.position.z + offA.z);
    const cb = new Vec3(trb.position.x + offB.x, trb.position.y + offB.y, trb.position.z + offB.z);
    const A0 = Quat.rotateVector(ra, new Vec3(1, 0, 0));
    const A1 = Quat.rotateVector(ra, new Vec3(0, 1, 0));
    const A2 = Quat.rotateVector(ra, new Vec3(0, 0, 1));
    const B0 = Quat.rotateVector(rb, new Vec3(1, 0, 0));
    const B1 = Quat.rotateVector(rb, new Vec3(0, 1, 0));
    const B2 = Quat.rotateVector(rb, new Vec3(0, 0, 1));
    const T = new Vec3(cb.x - ca.x, cb.y - ca.y, cb.z - ca.z);

    const proj = (u: Vec3, v: Vec3, w: Vec3, hx: number, hy: number, hz: number, L: Vec3) =>
        Math.abs(hx * (u.x * L.x + u.y * L.y + u.z * L.z)) +
        Math.abs(hy * (v.x * L.x + v.y * L.y + v.z * L.z)) +
        Math.abs(hz * (w.x * L.x + w.y * L.y + w.z * L.z));

    let minOverlap = Infinity;
    let sepNormal = new Vec3(0, 0, 0);
    const axes = [A0, A1, A2, B0, B1, B2,
        cross(A0, B0), cross(A0, B1), cross(A0, B2),
        cross(A1, B0), cross(A1, B1), cross(A1, B2),
        cross(A2, B0), cross(A2, B1), cross(A2, B2),
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
            const dir = (cb.x - ca.x) * n.x + (cb.y - ca.y) * n.y + (cb.z - ca.z) * n.z;
            if (dir < 0) sepNormal.set(-n.x, -n.y, -n.z);
        }
    }
    return { nx: sepNormal.x, ny: sepNormal.y, nz: sepNormal.z, depth: minOverlap };
}

function cross(a: Vec3, b: Vec3): Vec3 {
    return new Vec3(
        a.y * b.z - a.z * b.y,
        a.z * b.x - a.x * b.z,
        a.x * b.y - a.y * b.x,
    );
}

