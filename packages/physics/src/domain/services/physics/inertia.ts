import { getComponent } from '@pulse-ts/core';
import { RigidBody } from '../../../public/components/RigidBody';
import { Collider } from '../../../public/components/Collider';

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
    if (col.kind === 'capsule') {
        const r = Math.max(0, col.capRadius);
        const h = Math.max(0, col.capHalfHeight * 2);
        if (r === 0 && h === 0) {
            rb.inertiaTensor.set(0, 0, 0);
            rb.inverseInertiaTensor.set(0, 0, 0);
            return;
        }
        const pi = Math.PI;
        const Vc = pi * r * r * h; // cylinder volume
        const Vs = (4 / 3) * pi * r * r * r; // two hemispheres = sphere volume
        const Vt = Vc + Vs;
        const rho = Vt > 0 ? mass / Vt : 0;
        const m_c = rho * Vc;
        const m_s_total = rho * Vs;
        const m_h = m_s_total * 0.5;

        // About capsule's longitudinal axis (local Y)
        const Iyy = 0.5 * m_c * r * r + 2 * (0.4 * m_h * r * r); // (1/2) m r^2 + 2*(2/5 m r^2)

        // About perpendicular axes (local X and Z)
        const I_c_perp = (1 / 12) * m_c * (3 * r * r + h * h);
        // distance from capsule center to hemisphere COM along axis: h/2 + 3r/8
        const d = h * 0.5 + (3 / 8) * r;
        const I_h_perp = 0.4 * m_h * r * r + m_h * d * d; // about COM + parallel axis
        const I_perp = I_c_perp + 2 * I_h_perp;

        const ix = I_perp;
        const iy = Iyy;
        const iz = I_perp;
        rb.inertiaTensor.set(ix, iy, iz);
        rb.inverseInertiaTensor.set(
            ix > 0 ? 1 / ix : 0,
            iy > 0 ? 1 / iy : 0,
            iz > 0 ? 1 / iz : 0,
        );
        return;
    }
    if (col.kind === 'plane') {
        // Infinite plane: treat inertia as zero to prevent angular motion when mistakenly dynamic
        rb.inertiaTensor.set(0, 0, 0);
        rb.inverseInertiaTensor.set(0, 0, 0);
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
