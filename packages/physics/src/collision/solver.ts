import { Vec3, getComponent, Transform } from '@pulse-ts/core';
import { Collider } from '../components/Collider';
import { RigidBody } from '../components/RigidBody';

export interface ContactManifold { nx: number; ny: number; nz: number; depth: number }

/**
 * Resolves a single contact pair by positional correction and velocity impulses
 * with restitution and Coulomb friction. Mutates transforms and rigidbody velocities in-place.
 */
export function resolveContact(a: Collider, b: Collider, m: ContactManifold): void {
    const { nx, ny, nz, depth } = m;
    const rbA = getComponent(a.owner, RigidBody);
    const rbB = getComponent(b.owner, RigidBody);
    const invMassA = rbA && rbA.type === 'dynamic' ? rbA.inverseMass : 0;
    const invMassB = rbB && rbB.type === 'dynamic' ? rbB.inverseMass : 0;
    const totalInv = invMassA + invMassB;
    if (totalInv <= 0) return;

    // positional correction
    const ta = getComponent(a.owner, Transform)!;
    const tb = getComponent(b.owner, Transform)!;
    const corrX = nx * depth;
    const corrY = ny * depth;
    const corrZ = nz * depth;
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

    // velocity resolution
    const va = rbA?.linearVelocity ?? new Vec3();
    const vb = rbB?.linearVelocity ?? new Vec3();
    const rvx = vb.x - va.x;
    const rvy = vb.y - va.y;
    const rvz = vb.z - va.z;
    const vrel = rvx * nx + rvy * ny + rvz * nz;

    // normal impulse (restitution)
    let jn = 0;
    if (vrel < 0) {
        const e = Math.max(
            rbA?.restitution ?? 0.2,
            rbB?.restitution ?? 0.2,
            a.restitution ?? 0.2,
            b.restitution ?? 0.2,
        );
        const invTotal = 1 / totalInv;
        jn = -(1 + e) * vrel * invTotal;
        const jx = nx * jn, jy = ny * jn, jz = nz * jn;
        if (invMassA > 0) {
            va.x -= jx * invMassA; va.y -= jy * invMassA; va.z -= jz * invMassA;
        }
        if (invMassB > 0) {
            vb.x += jx * invMassB; vb.y += jy * invMassB; vb.z += jz * invMassB;
        }
    }

    // friction impulse (tangent)
    const muA = Math.max(rbA?.friction ?? 0.5, a.friction ?? 0.5);
    const muB = Math.max(rbB?.friction ?? 0.5, b.friction ?? 0.5);
    const mu = Math.sqrt(muA * muB);
    const tvx = rvx - vrel * nx;
    const tvy = rvy - vrel * ny;
    const tvz = rvz - vrel * nz;
    const tmag = Math.hypot(tvx, tvy, tvz);
    if (tmag > 1e-8 && totalInv > 0) {
        const tx = tvx / tmag, ty = tvy / tmag, tz = tvz / tmag;
        const invTotal = 1 / totalInv;
        let jt = -tmag * invTotal;
        const maxFriction = mu * Math.max(0, jn);
        if (Math.abs(jt) > maxFriction) jt = Math.sign(jt) * maxFriction;
        const jtx = tx * jt, jty = ty * jt, jtz = tz * jt;
        if (invMassA > 0) {
            va.x -= jtx * invMassA; va.y -= jty * invMassA; va.z -= jtz * invMassA;
        }
        if (invMassB > 0) {
            vb.x += jtx * invMassB; vb.y += jty * invMassB; vb.z += jtz * invMassB;
        }
    }
}

