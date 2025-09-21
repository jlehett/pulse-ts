import { Vec3, getComponent, Transform, Quat } from '@pulse-ts/core';
import { Collider } from '../../components/Collider';
import { RigidBody } from '../../components/RigidBody';
import { combineFriction, combineRestitution } from '../../materials';

export interface ContactManifold {
    nx: number;
    ny: number;
    nz: number;
    depth: number;
}

export interface ContactConstraint extends ContactManifold {
    a: Collider;
    b: Collider;
    /** World-space contact point. */
    px?: number;
    py?: number;
    pz?: number;
}

export function resolveContact(
    a: Collider,
    b: Collider,
    m: ContactManifold,
): void {
    const { nx, ny, nz, depth } = m;
    const rbA = getComponent(a.owner, RigidBody);
    const rbB = getComponent(b.owner, RigidBody);
    const invMassA = rbA && rbA.type === 'dynamic' ? rbA.inverseMass : 0;
    const invMassB = rbB && rbB.type === 'dynamic' ? rbB.inverseMass : 0;
    const totalInv = invMassA + invMassB;
    if (totalInv <= 0) return;

    const ta = getComponent(a.owner, Transform)!;
    const tb = getComponent(b.owner, Transform)!;
    const corrX = nx * depth,
        corrY = ny * depth,
        corrZ = nz * depth;
    if (invMassA > 0) {
        const k = invMassA / totalInv;
        ta.localPosition.x -= corrX * k;
        ta.localPosition.y -= corrY * k;
        ta.localPosition.z -= corrZ * k;
    }
    if (invMassB > 0) {
        const k = invMassB / totalInv;
        tb.localPosition.x += corrX * k;
        tb.localPosition.y += corrY * k;
        tb.localPosition.z += corrZ * k;
    }

    const va = rbA?.linearVelocity ?? new Vec3();
    const vb = rbB?.linearVelocity ?? new Vec3();
    const rvx = vb.x - va.x,
        rvy = vb.y - va.y,
        rvz = vb.z - va.z;
    const vrel = rvx * nx + rvy * ny + rvz * nz;

    let jn = 0;
    if (vrel < 0) {
        const e = combineRestitution(rbA, a, rbB, b);
        const invTotal = 1 / totalInv;
        jn = -(1 + e) * vrel * invTotal;
        const jx = nx * jn,
            jy = ny * jn,
            jz = nz * jn;
        if (invMassA > 0) {
            va.x -= jx * invMassA;
            va.y -= jy * invMassA;
            va.z -= jz * invMassA;
        }
        if (invMassB > 0) {
            vb.x += jx * invMassB;
            vb.y += jy * invMassB;
            vb.z += jz * invMassB;
        }
    }

    const mu = combineFriction(rbA, a, rbB, b);
    const tvx = rvx - vrel * nx,
        tvy = rvy - vrel * ny,
        tvz = rvz - vrel * nz;
    const tmag = Math.hypot(tvx, tvy, tvz);
    if (tmag > 1e-8 && totalInv > 0) {
        const tx = tvx / tmag,
            ty = tvy / tmag,
            tz = tvz / tmag;
        const invTotal = 1 / totalInv;
        let jt = -tmag * invTotal;
        const maxFriction = mu * Math.max(0, jn);
        if (Math.abs(jt) > maxFriction) jt = Math.sign(jt) * maxFriction;
        const jtx = tx * jt,
            jty = ty * jt,
            jtz = tz * jt;
        if (invMassA > 0) {
            va.x -= jtx * invMassA;
            va.y -= jty * invMassA;
            va.z -= jtz * invMassA;
        }
        if (invMassB > 0) {
            vb.x += jtx * invMassB;
            vb.y += jty * invMassB;
            vb.z += jtz * invMassB;
        }
    }
}

/** Applies positional correction only (no velocity impulses). */
export function correctPositions(
    { a, b, nx, ny, nz, depth }: ContactConstraint,
    slop = 0.005,
): void {
    const rbA = getComponent(a.owner, RigidBody);
    const rbB = getComponent(b.owner, RigidBody);
    const invMassA = rbA && rbA.type === 'dynamic' ? rbA.inverseMass : 0;
    const invMassB = rbB && rbB.type === 'dynamic' ? rbB.inverseMass : 0;
    const totalInv = invMassA + invMassB;
    if (totalInv <= 0) return;
    const ta = getComponent(a.owner, Transform)!;
    const tb = getComponent(b.owner, Transform)!;
    const pen = Math.max(0, depth - slop);
    if (pen <= 0) return;
    const corrX = nx * pen, corrY = ny * pen, corrZ = nz * pen;
    if (invMassA > 0) {
        const k = invMassA / totalInv;
        ta.localPosition.x -= corrX * k;
        ta.localPosition.y -= corrY * k;
        ta.localPosition.z -= corrZ * k;
    }
    if (invMassB > 0) {
        const k = invMassB / totalInv;
        tb.localPosition.x += corrX * k;
        tb.localPosition.y += corrY * k;
        tb.localPosition.z += corrZ * k;
    }
}

/**
 * Iteratively resolves contact constraints by applying normal and friction impulses.
 * Runs a small number of Gauss–Seidel iterations for stability.
 */
export function solveContactsIterative(
    constraints: ContactConstraint[],
    iterations: number,
    dt = 1 / 60,
    slop = 0.005,
    beta = 0.2,
): void {
    if (constraints.length === 0 || iterations <= 0) return;
    for (let iter = 0; iter < iterations; iter++) {
        for (const c of constraints) {
            const { a, b, nx, ny, nz } = c;
            const rbA = getComponent(a.owner, RigidBody);
            const rbB = getComponent(b.owner, RigidBody);
            const invMassA = rbA && rbA.type === 'dynamic' ? rbA.inverseMass : 0;
            const invMassB = rbB && rbB.type === 'dynamic' ? rbB.inverseMass : 0;
            const totalInv = invMassA + invMassB;
            if (totalInv <= 0) continue;

            const ta = getComponent(a.owner, Transform)!;
            const tb = getComponent(b.owner, Transform)!;
            const posA = ta.getWorldTRS().position;
            const posB = tb.getWorldTRS().position;
            const px = c.px ?? posA.x; // fallback prevents NaNs; yields no angular effect
            const py = c.py ?? posA.y;
            const pz = c.pz ?? posA.z;
            const ra = new Vec3(px - posA.x, py - posA.y, pz - posA.z);
            const rbv = new Vec3(px - posB.x, py - posB.y, pz - posB.z);

            const va = rbA?.linearVelocity ?? new Vec3();
            const vb = rbB?.linearVelocity ?? new Vec3();
            const wa = rbA?.angularVelocity ?? new Vec3();
            const wb = rbB?.angularVelocity ?? new Vec3();

            // Relative velocity at contact
            const vax = va.x + (wa.y * ra.z - wa.z * ra.y);
            const vay = va.y + (wa.z * ra.x - wa.x * ra.z);
            const vaz = va.z + (wa.x * ra.y - wa.y * ra.x);
            const vbx = vb.x + (wb.y * rbv.z - wb.z * rbv.y);
            const vby = vb.y + (wb.z * rbv.x - wb.x * rbv.z);
            const vbz = vb.z + (wb.x * rbv.y - wb.y * rbv.x);
            const rvx = vbx - vax, rvy = vby - vay, rvz = vbz - vaz;
            const vrel = rvx * nx + rvy * ny + rvz * nz;

            // Effective mass including angular terms
            const rnA = new Vec3(ra.y * nz - ra.z * ny, ra.z * nx - ra.x * nz, ra.x * ny - ra.y * nx);
            const rnB = new Vec3(rbv.y * nz - rbv.z * ny, rbv.z * nx - rbv.x * nz, rbv.x * ny - rbv.y * nx);
            const Ia_rnA = invInertiaApply(rbA, rnA, ta);
            const Ib_rnB = invInertiaApply(rbB, rnB, tb);
            const kNormal = totalInv + (rnA.x * Ia_rnA.x + rnA.y * Ia_rnA.y + rnA.z * Ia_rnA.z) + (rnB.x * Ib_rnB.x + rnB.y * Ib_rnB.y + rnB.z * Ib_rnB.z);

            // Positional bias (Baumgarte): drives residual penetration to zero
            const pen = Math.max(0, c.depth - slop);
            const biasVel = (beta / Math.max(1e-8, dt)) * pen;

            // Normal impulse with restitution and bias
            // Only apply when approaching along normal
            if (vrel - biasVel < 0) {
                const e = combineRestitution(rbA, a, rbB, b);
                const jn = -((1 + e) * vrel + biasVel) / Math.max(1e-8, kNormal);
                const jx = nx * jn, jy = ny * jn, jz = nz * jn;
                if (invMassA > 0) { va.x -= jx * invMassA; va.y -= jy * invMassA; va.z -= jz * invMassA; }
                if (invMassB > 0) { vb.x += jx * invMassB; vb.y += jy * invMassB; vb.z += jz * invMassB; }
                // Angular impulses: ω += I^-1 (r × J)
                const rXJ_a = new Vec3(ra.y * jz - ra.z * jy, ra.z * jx - ra.x * jz, ra.x * jy - ra.y * jx);
                const rXJ_b = new Vec3(rbv.y * jz - rbv.z * jy, rbv.z * jx - rbv.x * jz, rbv.x * jy - rbv.y * jx);
                const dW_a = invInertiaApply(rbA, rXJ_a, ta);
                const dW_b = invInertiaApply(rbB, rXJ_b, tb);
                wa.x -= dW_a.x; wa.y -= dW_a.y; wa.z -= dW_a.z;
                wb.x += dW_b.x; wb.y += dW_b.y; wb.z += dW_b.z;

                // Friction along tangent
                const mu = combineFriction(rbA, a, rbB, b);
                const tvx = rvx - vrel * nx, tvy = rvy - vrel * ny, tvz = rvz - vrel * nz;
                const tmag = Math.hypot(tvx, tvy, tvz);
                if (tmag > 1e-8) {
                    const tx = tvx / tmag, ty = tvy / tmag, tz = tvz / tmag;
                    const rtxA = new Vec3(ra.y * tz - ra.z * ty, ra.z * tx - ra.x * tz, ra.x * ty - ra.y * tx);
                    const rtxB = new Vec3(rbv.y * tz - rbv.z * ty, rbv.z * tx - rbv.x * tz, rbv.x * ty - rbv.y * tx);
                    const Ia_rtxA = invInertiaApply(rbA, rtxA, ta);
                    const Ib_rtxB = invInertiaApply(rbB, rtxB, tb);
                    const kT = totalInv + (rtxA.x * Ia_rtxA.x + rtxA.y * Ia_rtxA.y + rtxA.z * Ia_rtxA.z) + (rtxB.x * Ib_rtxB.x + rtxB.y * Ib_rtxB.y + rtxB.z * Ib_rtxB.z);
                    let jt = -tmag / Math.max(1e-8, kT);
                    const maxFriction = mu * Math.max(0, jn);
                    if (Math.abs(jt) > maxFriction) jt = Math.sign(jt) * maxFriction;
                    const jtx = tx * jt, jty = ty * jt, jtz = tz * jt;
                    if (invMassA > 0) { va.x -= jtx * invMassA; va.y -= jty * invMassA; va.z -= jtz * invMassA; }
                    if (invMassB > 0) { vb.x += jtx * invMassB; vb.y += jty * invMassB; vb.z += jtz * invMassB; }
                    // Angular friction impulse
                    const rXJt_a = new Vec3(ra.y * jtz - ra.z * jty, ra.z * jtx - ra.x * jtz, ra.x * jty - ra.y * jtx);
                    const rXJt_b = new Vec3(rbv.y * jtz - rbv.z * jty, rbv.z * jtx - rbv.x * jtz, rbv.x * jty - rbv.y * jtx);
                    const dWt_a = invInertiaApply(rbA, rXJt_a, ta);
                    const dWt_b = invInertiaApply(rbB, rXJt_b, tb);
                    wa.x -= dWt_a.x; wa.y -= dWt_a.y; wa.z -= dWt_a.z;
                    wb.x += dWt_b.x; wb.y += dWt_b.y; wb.z += dWt_b.z;
                }
            }
        }
    }
}

function invInertiaApply(rb: RigidBody | undefined | null, v: Vec3, t: Transform): Vec3 {
    if (!rb || rb.type !== 'dynamic') return new Vec3(0, 0, 0);
    const R = t.getWorldTRS().rotation;
    const conj = new Quat(-R.x, -R.y, -R.z, R.w);
    const vLocal = Quat.rotateVector(conj, v);
    const il = rb.inverseInertiaTensor;
    const wLocal = new Vec3(vLocal.x * il.x, vLocal.y * il.y, vLocal.z * il.z);
    const wWorld = Quat.rotateVector(R, wLocal);
    return wWorld;
}
