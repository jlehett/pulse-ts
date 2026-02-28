import {
    PLAYER_RADIUS,
    MOVE_SPEED,
    DASH_SPEED,
    DASH_DURATION,
    DASH_COOLDOWN,
    computeDashDirection,
} from './LocalPlayerNode';

describe('LocalPlayerNode constants', () => {
    it('player radius is positive', () => {
        expect(PLAYER_RADIUS).toBeGreaterThan(0);
    });

    it('move speed is positive', () => {
        expect(MOVE_SPEED).toBeGreaterThan(0);
    });

    it('dash speed exceeds move speed', () => {
        expect(DASH_SPEED).toBeGreaterThan(MOVE_SPEED);
    });

    it('dash duration is positive and short', () => {
        expect(DASH_DURATION).toBeGreaterThan(0);
        expect(DASH_DURATION).toBeLessThan(1);
    });

    it('dash cooldown is longer than dash duration', () => {
        expect(DASH_COOLDOWN).toBeGreaterThan(DASH_DURATION);
    });
});

describe('computeDashDirection', () => {
    it('returns normalized direction for positive X input', () => {
        const [x, z] = computeDashDirection(1, 0);
        expect(x).toBeCloseTo(1);
        expect(z).toBeCloseTo(0);
    });

    it('returns forward (-Z) for positive Y input', () => {
        const [x, z] = computeDashDirection(0, 1);
        expect(x).toBeCloseTo(0);
        expect(z).toBeCloseTo(-1);
    });

    it('returns backward (+Z) for negative Y input', () => {
        const [x, z] = computeDashDirection(0, -1);
        expect(x).toBeCloseTo(0);
        expect(z).toBeCloseTo(1);
    });

    it('normalizes diagonal input', () => {
        const [x, z] = computeDashDirection(1, 1);
        const len = Math.sqrt(x * x + z * z);
        expect(len).toBeCloseTo(1);
        expect(x).toBeCloseTo(1 / Math.sqrt(2));
        expect(z).toBeCloseTo(-1 / Math.sqrt(2));
    });

    it('defaults to forward (-Z) when input is zero', () => {
        const [x, z] = computeDashDirection(0, 0);
        expect(x).toBe(0);
        expect(z).toBe(-1);
    });

    it('normalizes non-unit magnitude input', () => {
        const [x, z] = computeDashDirection(3, 4);
        const len = Math.sqrt(x * x + z * z);
        expect(len).toBeCloseTo(1);
        expect(x).toBeCloseTo(3 / 5);
        expect(z).toBeCloseTo(-4 / 5);
    });
});
