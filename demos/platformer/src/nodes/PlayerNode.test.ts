import { Vec3 } from '@pulse-ts/core';
import { RigidBody } from '@pulse-ts/physics';
import {
    getKinematicSurfaceVelocityXZ,
    LANDING_VEL_THRESHOLD,
    SHAKE_INTENSITY_SCALE,
} from './PlayerNode';

/** Default fixed timestep matching the engine default (60 Hz). */
const DT = 1 / 60;

/**
 * Creates a minimal RigidBody-like object for testing the pure helper.
 * Only the velocity fields read by getKinematicSurfaceVelocityXZ are needed.
 */
function fakeBody(
    linear: [number, number, number],
    angular: [number, number, number] = [0, 0, 0],
): RigidBody {
    return {
        linearVelocity: new Vec3(...linear),
        angularVelocity: new Vec3(...angular),
    } as unknown as RigidBody;
}

/**
 * Helper: computes the expected rotational velocity contribution for a given
 * offset and angular velocity, matching the negated-angle convention used by
 * the helper (positive ωy rotates +X toward -Z in a Y-up right-hand system).
 */
function expectedRotationalVelocity(
    wy: number,
    rx: number,
    rz: number,
): [number, number] {
    const angle = -wy * DT;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const newRx = rx * cos - rz * sin;
    const newRz = rx * sin + rz * cos;
    return [(newRx - rx) / DT, (newRz - rz) / DT];
}

describe('getKinematicSurfaceVelocityXZ', () => {
    it('returns linear XZ velocity for a translating platform', () => {
        const body = fakeBody([3, 0, -2]);
        const pos = { x: 0, y: 0, z: 0 };
        const contact = { x: 1, y: 0, z: 1 };

        const [vx, vz] = getKinematicSurfaceVelocityXZ(body, pos, contact, DT);

        expect(vx).toBe(3);
        expect(vz).toBe(-2);
    });

    it('positive ωy moves a +X offset point toward -Z (right-hand rule)', () => {
        // In a Y-up right-hand system, positive ωy rotates +X toward -Z.
        // Contact at (1, 0, 0) relative to center should gain negative vz.
        const body = fakeBody([0, 0, 0], [0, 2, 0]);
        const pos = { x: 5, y: 0, z: 5 };
        const contact = { x: 6, y: 0, z: 5 }; // rx=1, rz=0

        const [vx, vz] = getKinematicSurfaceVelocityXZ(body, pos, contact, DT);

        const [eVx, eVz] = expectedRotationalVelocity(2, 1, 0);
        expect(vx).toBeCloseTo(eVx, 5);
        expect(vz).toBeCloseTo(eVz, 5);
        // Sanity: vz should be negative (moving toward -Z)
        expect(vz).toBeLessThan(0);
    });

    it('returns correct velocity for offset in Z', () => {
        // Contact 1 unit in +Z from center: rx=0, rz=1
        const body = fakeBody([0, 0, 0], [0, 2, 0]);
        const pos = { x: 5, y: 0, z: 5 };
        const contact = { x: 5, y: 0, z: 6 };

        const [vx, vz] = getKinematicSurfaceVelocityXZ(body, pos, contact, DT);

        const [eVx, eVz] = expectedRotationalVelocity(2, 0, 1);
        expect(vx).toBeCloseTo(eVx, 5);
        expect(vz).toBeCloseTo(eVz, 5);
    });

    it('sums linear and angular contributions', () => {
        // linear = (3, 0, -1), ωy = 2, contact offset = (1, 0, 1)
        const body = fakeBody([3, 0, -1], [0, 2, 0]);
        const pos = { x: 0, y: 0, z: 0 };
        const contact = { x: 1, y: 0, z: 1 };

        const [vx, vz] = getKinematicSurfaceVelocityXZ(body, pos, contact, DT);

        const [rVx, rVz] = expectedRotationalVelocity(2, 1, 1);
        expect(vx).toBeCloseTo(3 + rVx, 5);
        expect(vz).toBeCloseTo(-1 + rVz, 5);
    });

    it('skips angular contribution when angular velocity is zero', () => {
        const body = fakeBody([1, 5, 2], [0, 0, 0]);
        const pos = { x: 10, y: 0, z: 10 };
        const contact = { x: 15, y: 0, z: 15 }; // large offset, but ωy=0

        const [vx, vz] = getKinematicSurfaceVelocityXZ(body, pos, contact, DT);

        expect(vx).toBe(1);
        expect(vz).toBe(2);
    });

    it('returns zero angular contribution when contact is at platform center', () => {
        const body = fakeBody([0, 0, 0], [0, 5, 0]);
        const pos = { x: 3, y: 0, z: 3 };
        const contact = { x: 3, y: 0, z: 3 }; // exactly at center

        const [vx, vz] = getKinematicSurfaceVelocityXZ(body, pos, contact, DT);

        expect(vx).toBeCloseTo(0, 10);
        expect(vz).toBeCloseTo(0, 10);
    });

    it('does not drift outward over many steps on a spinning platform', () => {
        // Simulate 600 steps (10 seconds at 60 Hz) on a platform spinning at
        // 1 rad/s. If the velocity correctly includes centripetal correction,
        // the radius should stay constant.
        const wy = 1;
        let rx = 5;
        let rz = 0;
        const platformPos = { x: 0, y: 0, z: 0 };

        for (let i = 0; i < 600; i++) {
            const body = fakeBody([0, 0, 0], [0, wy, 0]);
            const contact = { x: rx, y: 0, z: rz };
            const [vx, vz] = getKinematicSurfaceVelocityXZ(
                body,
                platformPos,
                contact,
                DT,
            );
            rx += vx * DT;
            rz += vz * DT;
        }

        const finalRadius = Math.sqrt(rx * rx + rz * rz);
        expect(finalRadius).toBeCloseTo(5, 3); // should stay at radius 5
    });
});

describe('Landing shake constants', () => {
    it('LANDING_VEL_THRESHOLD is positive', () => {
        expect(LANDING_VEL_THRESHOLD).toBeGreaterThan(0);
    });

    it('SHAKE_INTENSITY_SCALE is positive and small', () => {
        expect(SHAKE_INTENSITY_SCALE).toBeGreaterThan(0);
        expect(SHAKE_INTENSITY_SCALE).toBeLessThan(1);
    });
});
