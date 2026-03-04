jest.mock('three/examples/jsm/postprocessing/ShaderPass.js', () => ({
    ShaderPass: jest.fn(),
}));

import {
    PLAYER_RADIUS,
    MOVE_IMPULSE,
    LINEAR_DAMPING,
    DASH_SPEED,
    DASH_DURATION,
    DASH_COOLDOWN,
    KNOCKBACK_BASE,
    KNOCKBACK_VELOCITY_SCALE,
    IMPACT_COOLDOWN,
    KNOCKOUT_BURST_COUNT,
    INDICATOR_RING_COLOR,
    INDICATOR_RING_SCALE,
    INDICATOR_RING_BORDER,
    computeDashDirection,
    computeKnockback,
    computeApproachSpeed,
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

    it('knockback base is positive', () => {
        expect(KNOCKBACK_BASE).toBeGreaterThan(0);
    });

    it('knockback velocity scale is positive', () => {
        expect(KNOCKBACK_VELOCITY_SCALE).toBeGreaterThan(0);
    });

    it('impact cooldown prevents sound spam', () => {
        expect(IMPACT_COOLDOWN).toBeGreaterThan(0.1);
        expect(IMPACT_COOLDOWN).toBeLessThan(2);
    });

    it('knockout burst count is a large positive number', () => {
        expect(KNOCKOUT_BURST_COUNT).toBeGreaterThanOrEqual(40);
    });
});

describe('Indicator ring constants', () => {
    it('ring color is a warm yellow', () => {
        // Light yellow: R > 0xF0, G > 0xE0, B < 0xA0
        const r = (INDICATOR_RING_COLOR >> 16) & 0xff;
        const g = (INDICATOR_RING_COLOR >> 8) & 0xff;
        const b = INDICATOR_RING_COLOR & 0xff;
        expect(r).toBeGreaterThan(0xf0);
        expect(g).toBeGreaterThan(0xe0);
        expect(b).toBeLessThan(0xa0);
    });

    it('ring scale is larger than 1 (bigger than player)', () => {
        expect(INDICATOR_RING_SCALE).toBeGreaterThan(1);
    });

    it('ring border is a small positive pixel value', () => {
        expect(INDICATOR_RING_BORDER).toBeGreaterThan(0);
        expect(INDICATOR_RING_BORDER).toBeLessThanOrEqual(4);
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

describe('computeApproachSpeed', () => {
    it('returns full speed when moving directly toward target', () => {
        // Attacker at (-5,0) moving at (10,0) toward target at (0,0)
        const speed = computeApproachSpeed(0, 0, -5, 0, 10, 0);
        expect(speed).toBeCloseTo(10);
    });

    it('returns zero for perpendicular (glancing) movement', () => {
        // Attacker at (-5,0) moving at (0,10) — perpendicular to target
        const speed = computeApproachSpeed(0, 0, -5, 0, 0, 10);
        expect(speed).toBeCloseTo(0);
    });

    it('returns zero when moving away from target', () => {
        // Attacker at (-5,0) moving at (-10,0) — away from target
        const speed = computeApproachSpeed(0, 0, -5, 0, -10, 0);
        expect(speed).toBe(0);
    });

    it('returns partial speed for diagonal approach', () => {
        // Attacker at (-5,0) moving at (10,10) — 45 degrees off axis
        const speed = computeApproachSpeed(0, 0, -5, 0, 10, 10);
        // Only the X component contributes (direction is purely +X)
        expect(speed).toBeCloseTo(10);
    });

    it('returns velocity magnitude when positions overlap', () => {
        const speed = computeApproachSpeed(3, 3, 3, 3, 6, 8);
        expect(speed).toBeCloseTo(10); // sqrt(36 + 64) = 10
    });

    it('handles zero velocity', () => {
        const speed = computeApproachSpeed(0, 0, -5, 0, 0, 0);
        expect(speed).toBe(0);
    });
});
