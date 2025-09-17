import { Quat, Vec3, getComponent, Transform } from '@pulse-ts/core';
import { RigidBody } from '../../components/RigidBody';
import { Collider } from '../../components/Collider';
import { refreshAutomaticInertia } from './inertia';

export function integrateVelocities(
    bodies: Iterable<RigidBody>,
    gravity: Vec3,
    dt: number,
    hasCollider: (c: Collider) => boolean,
): void {
    for (const rb of bodies) {
        if (!rb.owner?.world) continue;
        if (rb.autoComputeInertia) refreshAutomaticInertia(rb, hasCollider);

        const hasImpulse =
            rb.impulse.x !== 0 || rb.impulse.y !== 0 || rb.impulse.z !== 0;
        const hasForce =
            rb.force.x !== 0 || rb.force.y !== 0 || rb.force.z !== 0;
        const hasAngularImpulse =
            rb.angularImpulse.x !== 0 ||
            rb.angularImpulse.y !== 0 ||
            rb.angularImpulse.z !== 0;
        const hasTorque =
            rb.torque.x !== 0 || rb.torque.y !== 0 || rb.torque.z !== 0;

        if (rb.type !== 'dynamic') {
            if (hasImpulse) rb.clearImpulse();
            if (hasForce) rb.clearForce();
            if (hasAngularImpulse) rb.clearAngularImpulse();
            if (hasTorque) rb.clearTorque();
            continue;
        }

        const invMass = rb.inverseMass;
        const invInertia = rb.inverseInertiaTensor;

        if (hasImpulse) {
            if (invMass > 0) {
                rb.linearVelocity.x += rb.impulse.x * invMass;
                rb.linearVelocity.y += rb.impulse.y * invMass;
                rb.linearVelocity.z += rb.impulse.z * invMass;
            }
            rb.clearImpulse();
        }

        if (hasForce) {
            if (invMass > 0) {
                const scale = invMass * dt;
                rb.linearVelocity.x += rb.force.x * scale;
                rb.linearVelocity.y += rb.force.y * scale;
                rb.linearVelocity.z += rb.force.z * scale;
            }
            rb.clearForce();
        }

        if (hasAngularImpulse) {
            rb.angularVelocity.x += rb.angularImpulse.x * invInertia.x;
            rb.angularVelocity.y += rb.angularImpulse.y * invInertia.y;
            rb.angularVelocity.z += rb.angularImpulse.z * invInertia.z;
            rb.clearAngularImpulse();
        }

        if (hasTorque) {
            rb.angularVelocity.x += rb.torque.x * invInertia.x * dt;
            rb.angularVelocity.y += rb.torque.y * invInertia.y * dt;
            rb.angularVelocity.z += rb.torque.z * invInertia.z * dt;
            rb.clearTorque();
        }

        if (invMass > 0) {
            rb.linearVelocity.x += gravity.x * rb.gravityScale * dt;
            rb.linearVelocity.y += gravity.y * rb.gravityScale * dt;
            rb.linearVelocity.z += gravity.z * rb.gravityScale * dt;
        }

        if (rb.linearDamping > 0) {
            const f = Math.max(0, 1 - rb.linearDamping * dt);
            rb.linearVelocity.x *= f;
            rb.linearVelocity.y *= f;
            rb.linearVelocity.z *= f;
        }

        if (rb.angularDamping > 0) {
            const f = Math.max(0, 1 - rb.angularDamping * dt);
            rb.angularVelocity.x *= f;
            rb.angularVelocity.y *= f;
            rb.angularVelocity.z *= f;
        }
    }
}

export function integrateTransforms(
    bodies: Iterable<RigidBody>,
    dt: number,
    planeY?: number,
): void {
    const tmpQuat = new Quat();
    const tmpQuat2 = new Quat();
    for (const rb of bodies) {
        const t = getComponent(rb.owner, Transform);
        if (!t) continue;
        if (rb.type === 'dynamic') {
            t.localPosition.addScaled(rb.linearVelocity, dt);
            const wx = rb.angularVelocity.x,
                wy = rb.angularVelocity.y,
                wz = rb.angularVelocity.z;
            if (wx !== 0 || wy !== 0 || wz !== 0) {
                const mag = Math.hypot(wx, wy, wz);
                const angle = mag * dt;
                const half = angle * 0.5;
                const sinHalf = Math.sin(half);
                const cosHalf = Math.cos(half);
                const scale = mag > 1e-6 ? sinHalf / mag : 0.5 * dt;
                const delta = tmpQuat
                    .set(wx * scale, wy * scale, wz * scale, cosHalf)
                    .normalize();
                const updated = Quat.multiply(delta, t.localRotation, tmpQuat2);
                t.localRotation.set(updated.x, updated.y, updated.z, updated.w);
            }
        }
        if (planeY != null) {
            const col = getComponent(rb.owner, Collider);
            let radius = 0;
            if (col && col.kind === 'sphere') radius = col.radius;
            const bottom = t.localPosition.y + (col?.offset.y ?? 0) - radius;
            if (bottom < planeY) {
                const pen = planeY - bottom;
                t.localPosition.y += pen;
                if (rb.type === 'dynamic') {
                    const e = Math.max(rb.restitution, col?.restitution ?? 0);
                    if (rb.linearVelocity.y < 0)
                        rb.linearVelocity.y = -rb.linearVelocity.y * e;
                }
            }
        }
    }
}
