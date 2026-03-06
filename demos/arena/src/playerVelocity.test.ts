import {
    updatePlayerVelocity,
    getPlayerVelocity,
    resetPlayerVelocity,
} from './playerVelocity';

beforeEach(() => {
    resetPlayerVelocity();
});

describe('updatePlayerVelocity / getPlayerVelocity', () => {
    it('returns zero velocity before any updates', () => {
        const [vx, vz] = getPlayerVelocity(0);
        expect(vx).toBe(0);
        expect(vz).toBe(0);
    });

    it('derives velocity from position deltas', () => {
        const dt = 1 / 60;
        // First call establishes baseline position
        updatePlayerVelocity(0, 0, 0, dt);
        // Second call computes velocity from delta
        updatePlayerVelocity(0, 1, 0, dt);
        const [vx, vz] = getPlayerVelocity(0);
        expect(vx).toBeCloseTo(60, 0); // 1 unit / (1/60)s = 60 units/s
        expect(vz).toBe(0);
    });

    it('tracks players independently', () => {
        const dt = 1 / 60;
        updatePlayerVelocity(0, 0, 0, dt);
        updatePlayerVelocity(1, 0, 0, dt);
        updatePlayerVelocity(0, 1, 0, dt);
        updatePlayerVelocity(1, 0, 2, dt);

        const [vx0, vz0] = getPlayerVelocity(0);
        const [vx1, vz1] = getPlayerVelocity(1);
        expect(vx0).toBeCloseTo(60, 0);
        expect(vz0).toBe(0);
        expect(vx1).toBe(0);
        expect(vz1).toBeCloseTo(120, 0);
    });

    it('resets all state', () => {
        updatePlayerVelocity(0, 0, 0, 1 / 60);
        updatePlayerVelocity(0, 5, 5, 1 / 60);
        resetPlayerVelocity();
        const [vx, vz] = getPlayerVelocity(0);
        expect(vx).toBe(0);
        expect(vz).toBe(0);
    });

    it('skips velocity computation when dt is 0', () => {
        updatePlayerVelocity(0, 0, 0, 1 / 60);
        updatePlayerVelocity(0, 5, 5, 1 / 60);
        // dt=0 should not overwrite with Infinity
        updatePlayerVelocity(0, 10, 10, 0);
        const [vx, vz] = getPlayerVelocity(0);
        // Should still have the velocity from the previous non-zero dt update
        expect(vx).toBeCloseTo(300, 0);
        expect(vz).toBeCloseTo(300, 0);
    });
});
