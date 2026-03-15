import {
    StarfieldNode,
    createStarPositions,
    STAR_COUNT,
    STAR_RADIUS_MIN,
    STAR_RADIUS_MAX,
    STAR_SIZE,
    STAR_OPACITY,
    STAR_ROTATION_RATE,
    STAR_TWINKLE_SPEED,
    STAR_TWINKLE_MIN,
} from './StarfieldNode';

describe('StarfieldNode', () => {
    it('is a function', () => {
        expect(typeof StarfieldNode).toBe('function');
    });
});

describe('StarfieldNode constants', () => {
    it('STAR_COUNT is positive', () => {
        expect(STAR_COUNT).toBeGreaterThan(0);
    });

    it('STAR_RADIUS_MIN is positive', () => {
        expect(STAR_RADIUS_MIN).toBeGreaterThan(0);
    });

    it('STAR_RADIUS_MAX is greater than STAR_RADIUS_MIN', () => {
        expect(STAR_RADIUS_MAX).toBeGreaterThan(STAR_RADIUS_MIN);
    });

    it('STAR_SIZE is positive', () => {
        expect(STAR_SIZE).toBeGreaterThan(0);
    });

    it('STAR_OPACITY is between 0 and 1', () => {
        expect(STAR_OPACITY).toBeGreaterThan(0);
        expect(STAR_OPACITY).toBeLessThanOrEqual(1);
    });

    it('STAR_ROTATION_RATE is positive', () => {
        expect(STAR_ROTATION_RATE).toBeGreaterThan(0);
    });

    it('STAR_TWINKLE_SPEED is positive', () => {
        expect(STAR_TWINKLE_SPEED).toBeGreaterThan(0);
    });

    it('STAR_TWINKLE_MIN is between 0 and 1', () => {
        expect(STAR_TWINKLE_MIN).toBeGreaterThanOrEqual(0);
        expect(STAR_TWINKLE_MIN).toBeLessThan(1);
    });
});

describe('createStarPositions', () => {
    it('returns a Float32Array of correct length', () => {
        const positions = createStarPositions(100, 10, 20);
        expect(positions).toBeInstanceOf(Float32Array);
        expect(positions.length).toBe(100 * 3);
    });

    it('all points are within radius bounds', () => {
        const rMin = 10;
        const rMax = 30;
        const positions = createStarPositions(200, rMin, rMax);
        for (let i = 0; i < 200; i++) {
            const x = positions[i * 3];
            const y = positions[i * 3 + 1];
            const z = positions[i * 3 + 2];
            const r = Math.sqrt(x * x + y * y + z * z);
            expect(r).toBeGreaterThanOrEqual(rMin - 0.01);
            expect(r).toBeLessThanOrEqual(rMax + 0.01);
        }
    });

    it('returns empty array for count 0', () => {
        const positions = createStarPositions(0, 10, 20);
        expect(positions.length).toBe(0);
    });

    it('places stars in both hemispheres (full sphere)', () => {
        const positions = createStarPositions(500, 10, 20);
        let hasPositiveY = false;
        let hasNegativeY = false;
        for (let i = 0; i < 500; i++) {
            const y = positions[i * 3 + 1];
            if (y > 0) hasPositiveY = true;
            if (y < 0) hasNegativeY = true;
        }
        expect(hasPositiveY).toBe(true);
        expect(hasNegativeY).toBe(true);
    });
});
