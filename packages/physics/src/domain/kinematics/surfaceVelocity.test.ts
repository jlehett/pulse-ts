import { getKinematicSurfaceVelocity } from './surfaceVelocity';

const ZERO = { x: 0, y: 0, z: 0 };
const DT = 1 / 60;

describe('getKinematicSurfaceVelocity', () => {
    test('returns linear velocity when angular velocity is zero', () => {
        const [vx, vy, vz] = getKinematicSurfaceVelocity(
            { x: 3, y: 0, z: -1 },
            ZERO,
            ZERO,
            { x: 1, y: 0, z: 0 },
            DT,
        );
        expect(vx).toBeCloseTo(3);
        expect(vy).toBeCloseTo(0);
        expect(vz).toBeCloseTo(-1);
    });

    test('returns zero velocity for stationary body', () => {
        const [vx, vy, vz] = getKinematicSurfaceVelocity(
            ZERO,
            ZERO,
            ZERO,
            { x: 1, y: 0, z: 0 },
            DT,
        );
        expect(vx).toBeCloseTo(0);
        expect(vy).toBeCloseTo(0);
        expect(vz).toBeCloseTo(0);
    });

    test('Y-axis rotation produces tangential XZ velocity', () => {
        // Body at origin, contact point at (1, 0, 0), rotating around Y
        // Positive ωy in right-hand system: +X rotates toward -Z
        const wy = 2; // rad/s
        const [vx, , vz] = getKinematicSurfaceVelocity(
            ZERO,
            { x: 0, y: wy, z: 0 },
            ZERO,
            { x: 1, y: 0, z: 0 },
            DT,
        );
        // Tangential speed ≈ ω * r = 2 * 1 = 2
        const speed = Math.sqrt(vx * vx + vz * vz);
        expect(speed).toBeCloseTo(2, 1);
        // Direction: +X toward -Z means vz should be negative
        expect(vz).toBeLessThan(0);
    });

    test('X-axis rotation produces tangential YZ velocity', () => {
        // Contact at (0, 0, 1), rotating around X
        // Positive ωx: +Z rotates toward -Y (right-hand rule)
        const wx = 3;
        const [vx, vy, vz] = getKinematicSurfaceVelocity(
            ZERO,
            { x: wx, y: 0, z: 0 },
            ZERO,
            { x: 0, y: 0, z: 1 },
            DT,
        );
        // No X component (rotation axis)
        expect(vx).toBeCloseTo(0, 1);
        // Tangential speed ≈ ω * r = 3
        const speed = Math.sqrt(vy * vy + vz * vz);
        expect(speed).toBeCloseTo(3, 1);
    });

    test('combines linear and angular velocity', () => {
        const [vx, vy, vz] = getKinematicSurfaceVelocity(
            { x: 5, y: 0, z: 0 },
            { x: 0, y: 2, z: 0 },
            ZERO,
            { x: 1, y: 0, z: 0 },
            DT,
        );
        // Linear component is 5 in X, plus rotational component
        expect(vx).toBeGreaterThan(4); // ~5 + small rotational X
        // Rotational contribution adds negative Z
        expect(vz).toBeLessThan(0);
        // Y unchanged (rotation around Y, no Y contribution for point in XZ plane)
        expect(vy).toBeCloseTo(0, 1);
    });

    test('handles offset body position', () => {
        // Body at (10, 0, 0), contact at (11, 0, 0) — offset is (1, 0, 0)
        const [vx1, , vz1] = getKinematicSurfaceVelocity(
            ZERO,
            { x: 0, y: 2, z: 0 },
            { x: 10, y: 0, z: 0 },
            { x: 11, y: 0, z: 0 },
            DT,
        );
        // Same as body at origin with contact at (1, 0, 0)
        const [vx2, , vz2] = getKinematicSurfaceVelocity(
            ZERO,
            { x: 0, y: 2, z: 0 },
            ZERO,
            { x: 1, y: 0, z: 0 },
            DT,
        );
        expect(vx1).toBeCloseTo(vx2, 5);
        expect(vz1).toBeCloseTo(vz2, 5);
    });

    test('contact point at body center produces no angular contribution', () => {
        const [vx, vy, vz] = getKinematicSurfaceVelocity(
            { x: 1, y: 2, z: 3 },
            { x: 5, y: 5, z: 5 },
            { x: 10, y: 10, z: 10 },
            { x: 10, y: 10, z: 10 }, // same as body position
            DT,
        );
        // Only linear velocity
        expect(vx).toBeCloseTo(1);
        expect(vy).toBeCloseTo(2);
        expect(vz).toBeCloseTo(3);
    });

    test('larger radius produces proportionally larger tangential speed', () => {
        const [, , vz1] = getKinematicSurfaceVelocity(
            ZERO,
            { x: 0, y: 1, z: 0 },
            ZERO,
            { x: 1, y: 0, z: 0 },
            DT,
        );
        const [, , vz2] = getKinematicSurfaceVelocity(
            ZERO,
            { x: 0, y: 1, z: 0 },
            ZERO,
            { x: 2, y: 0, z: 0 },
            DT,
        );
        // v = ω × r, so doubling r doubles tangential speed
        expect(Math.abs(vz2)).toBeCloseTo(Math.abs(vz1) * 2, 1);
    });

    test('matches legacy XZ-only result for Y-axis rotation', () => {
        // Verify backward compatibility with the old getKinematicSurfaceVelocityXZ
        const linVel = { x: 2, y: 0, z: -1 };
        const angVel = { x: 0, y: 3, z: 0 };
        const bodyPos = { x: 5, y: 0, z: 5 };
        const contact = { x: 6, y: 0, z: 5.5 };

        const [vx, , vz] = getKinematicSurfaceVelocity(
            linVel,
            angVel,
            bodyPos,
            contact,
            DT,
        );

        // Manually compute old algorithm for comparison
        const wy = angVel.y;
        const rx = contact.x - bodyPos.x;
        const rz = contact.z - bodyPos.z;
        const angle = -wy * DT;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const newRx = rx * cos - rz * sin;
        const newRz = rx * sin + rz * cos;
        const expectedVx = linVel.x + (newRx - rx) / DT;
        const expectedVz = linVel.z + (newRz - rz) / DT;

        expect(vx).toBeCloseTo(expectedVx, 3);
        expect(vz).toBeCloseTo(expectedVz, 3);
    });
});
