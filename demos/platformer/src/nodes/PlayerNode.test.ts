import { getKinematicSurfaceVelocity } from '@pulse-ts/physics';

/** Default fixed timestep matching the engine default (60 Hz). */
const DT = 1 / 60;

const ZERO = { x: 0, y: 0, z: 0 };

/**
 * Helper: computes the expected rotational velocity contribution for a given
 * offset and angular velocity, matching the negated-angle convention used by
 * the old helper (positive ωy rotates +X toward -Z in a Y-up right-hand system).
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

describe('getKinematicSurfaceVelocity', () => {
    it('returns linear XZ velocity for a translating platform', () => {
        const [vx, , vz] = getKinematicSurfaceVelocity(
            { x: 3, y: 0, z: -2 },
            ZERO,
            ZERO,
            { x: 1, y: 0, z: 1 },
            DT,
        );

        expect(vx).toBe(3);
        expect(vz).toBe(-2);
    });

    it('positive ωy moves a +X offset point toward -Z (right-hand rule)', () => {
        const pos = { x: 5, y: 0, z: 5 };
        const contact = { x: 6, y: 0, z: 5 }; // rx=1, rz=0

        const [vx, , vz] = getKinematicSurfaceVelocity(
            ZERO,
            { x: 0, y: 2, z: 0 },
            pos,
            contact,
            DT,
        );

        const [eVx, eVz] = expectedRotationalVelocity(2, 1, 0);
        expect(vx).toBeCloseTo(eVx, 5);
        expect(vz).toBeCloseTo(eVz, 5);
        // Sanity: vz should be negative (moving toward -Z)
        expect(vz).toBeLessThan(0);
    });

    it('returns correct velocity for offset in Z', () => {
        const pos = { x: 5, y: 0, z: 5 };
        const contact = { x: 5, y: 0, z: 6 };

        const [vx, , vz] = getKinematicSurfaceVelocity(
            ZERO,
            { x: 0, y: 2, z: 0 },
            pos,
            contact,
            DT,
        );

        const [eVx, eVz] = expectedRotationalVelocity(2, 0, 1);
        expect(vx).toBeCloseTo(eVx, 5);
        expect(vz).toBeCloseTo(eVz, 5);
    });

    it('sums linear and angular contributions', () => {
        const [vx, , vz] = getKinematicSurfaceVelocity(
            { x: 3, y: 0, z: -1 },
            { x: 0, y: 2, z: 0 },
            ZERO,
            { x: 1, y: 0, z: 1 },
            DT,
        );

        const [rVx, rVz] = expectedRotationalVelocity(2, 1, 1);
        expect(vx).toBeCloseTo(3 + rVx, 5);
        expect(vz).toBeCloseTo(-1 + rVz, 5);
    });

    it('skips angular contribution when angular velocity is zero', () => {
        const [vx, , vz] = getKinematicSurfaceVelocity(
            { x: 1, y: 5, z: 2 },
            ZERO,
            { x: 10, y: 0, z: 10 },
            { x: 15, y: 0, z: 15 },
            DT,
        );

        expect(vx).toBe(1);
        expect(vz).toBe(2);
    });

    it('returns zero angular contribution when contact is at platform center', () => {
        const [vx, , vz] = getKinematicSurfaceVelocity(
            ZERO,
            { x: 0, y: 5, z: 0 },
            { x: 3, y: 0, z: 3 },
            { x: 3, y: 0, z: 3 },
            DT,
        );

        expect(vx).toBeCloseTo(0, 10);
        expect(vz).toBeCloseTo(0, 10);
    });

    it('does not drift outward over many steps on a spinning platform', () => {
        const wy = 1;
        let rx = 5;
        let rz = 0;
        const platformPos = { x: 0, y: 0, z: 0 };

        for (let i = 0; i < 600; i++) {
            const contact = { x: rx, y: 0, z: rz };
            const [vx, , vz] = getKinematicSurfaceVelocity(
                ZERO,
                { x: 0, y: wy, z: 0 },
                platformPos,
                contact,
                DT,
            );
            rx += vx * DT;
            rz += vz * DT;
        }

        const finalRadius = Math.sqrt(rx * rx + rz * rz);
        expect(finalRadius).toBeCloseTo(5, 3);
    });
});
