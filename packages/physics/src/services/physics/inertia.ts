import { getComponent } from '@pulse-ts/core';
import { RigidBody } from '../../components/RigidBody';
import { Collider } from '../../components/Collider';

export function refreshAutomaticInertia(
    rb: RigidBody,
    hasCollider: (c: Collider) => boolean,
) {
    if (!rb.autoComputeInertia) return;
    const mass = rb.mass;
    if (rb.type !== 'dynamic' || mass <= 0 || !rb.owner?.world) {
        rb.inertiaTensor.set(0, 0, 0);
        rb.inverseInertiaTensor.set(0, 0, 0);
        return;
    }
    const col = getComponent(rb.owner, Collider);
    if (!col || !hasCollider(col)) {
        const inv = mass > 0 ? 1 / mass : 0;
        rb.inertiaTensor.set(mass, mass, mass);
        rb.inverseInertiaTensor.set(inv, inv, inv);
        return;
    }
    if (col.kind === 'sphere') {
        const r = Math.max(0, col.radius);
        const moment = 0.4 * mass * r * r;
        const inv = moment > 0 ? 1 / moment : 0;
        rb.inertiaTensor.set(moment, moment, moment);
        rb.inverseInertiaTensor.set(inv, inv, inv);
        return;
    }
    const hx = Math.max(0, col.halfX);
    const hy = Math.max(0, col.halfY);
    const hz = Math.max(0, col.halfZ);
    const ix = (mass / 3) * (hy * hy + hz * hz);
    const iy = (mass / 3) * (hx * hx + hz * hz);
    const iz = (mass / 3) * (hx * hx + hy * hy);
    rb.inertiaTensor.set(ix, iy, iz);
    rb.inverseInertiaTensor.set(
        ix > 0 ? 1 / ix : 0,
        iy > 0 ? 1 / iy : 0,
        iz > 0 ? 1 / iz : 0,
    );
}
