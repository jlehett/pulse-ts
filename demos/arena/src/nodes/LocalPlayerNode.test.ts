import {
    PLAYER_RADIUS,
    MOVE_IMPULSE,
    LINEAR_DAMPING,
    DASH_SPEED,
    DASH_DURATION,
    DASH_COOLDOWN,
    KNOCKBACK_FORCE,
    IMPACT_COOLDOWN,
    KNOCKOUT_BURST_COUNT,
    DASH_TRAIL_RATE,
    computeDashDirection,
    computeKnockback,
} from './LocalPlayerNode';

describe('LocalPlayerNode constants', () => {
    it('player radius is positive', () => {
        expect(PLAYER_RADIUS).toBeGreaterThan(0);
    });

    it('move impulse is positive', () => {
        expect(MOVE_IMPULSE).toBeGreaterThan(0);
    });

    it('linear damping is positive', () => {
        expect(LINEAR_DAMPING).toBeGreaterThan(0);
    });

    it('dash speed is high for burst movement', () => {
        expect(DASH_SPEED).toBeGreaterThan(20);
    });

    it('dash duration is positive and short', () => {
        expect(DASH_DURATION).toBeGreaterThan(0);
        expect(DASH_DURATION).toBeLessThan(1);
    });

    it('dash cooldown is longer than dash duration', () => {
        expect(DASH_COOLDOWN).toBeGreaterThan(DASH_DURATION);
    });

    it('knockback force is positive', () => {
        expect(KNOCKBACK_FORCE).toBeGreaterThan(0);
    });

    it('impact cooldown prevents sound spam', () => {
        expect(IMPACT_COOLDOWN).toBeGreaterThan(0.1);
        expect(IMPACT_COOLDOWN).toBeLessThan(2);
    });

    it('knockout burst count is a large positive number', () => {
        expect(KNOCKOUT_BURST_COUNT).toBeGreaterThanOrEqual(40);
    });

    it('dash trail rate is positive', () => {
        expect(DASH_TRAIL_RATE).toBeGreaterThan(0);
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

describe('computeKnockback', () => {
    it('pushes away from other player along X axis', () => {
        const [x, y, z] = computeKnockback(5, 0, 3, 0, 10);
        expect(x).toBeCloseTo(10);
        expect(z).toBeCloseTo(0);
        expect(y).toBe(0);
    });

    it('pushes away from other player along Z axis', () => {
        const [x, y, z] = computeKnockback(0, 5, 0, 2, 10);
        expect(x).toBeCloseTo(0);
        expect(z).toBeCloseTo(10);
        expect(y).toBe(0);
    });

    it('pushes away diagonally and normalizes direction', () => {
        const [x, y, z] = computeKnockback(1, 1, 0, 0, 10);
        const horizontalLen = Math.sqrt(x * x + z * z);
        expect(horizontalLen).toBeCloseTo(10);
        expect(y).toBe(0);
    });

    it('handles overlapping positions with fallback direction', () => {
        const [x, y, z] = computeKnockback(3, 3, 3, 3, 8);
        expect(x).toBe(8);
        expect(y).toBe(0);
        expect(z).toBe(0);
    });

    it('scales with magnitude', () => {
        const [x1] = computeKnockback(5, 0, 0, 0, 5);
        const [x2] = computeKnockback(5, 0, 0, 0, 10);
        expect(x2).toBeCloseTo(x1 * 2);
    });
});
