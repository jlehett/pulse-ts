import {
    AtmosphericDustNode,
    noise2D,
    DUST_COUNT,
    DUST_COLOR,
    DUST_SPEED_MIN,
    DUST_SPEED_MAX,
    DUST_SIZE,
    DUST_OPACITY,
    DUST_SPAWN_Y,
    DUST_SPREAD_XZ,
    DUST_SPREAD_Y,
    DUST_PUSH_RADIUS,
    DUST_PUSH_STRENGTH,
    DUST_DISP_ATTACK,
    DUST_DISP_RELEASE,
    DUST_TRAIL_DECAY,
    DUST_FADE_DISTANCE,
    DUST_ORBIT_STRENGTH,
    DUST_NOISE_STRENGTH,
    DUST_SHIMMER_FREQ,
    DUST_SHIMMER_MIN,
    DUST_SHIMMER_MAX_OPACITY,
    DUST_DISP_EMISSIVE_BOOST,
    DUST_DISP_SIZE_BOOST,
} from './AtmosphericDustNode';

describe('AtmosphericDustNode', () => {
    it('is a function', () => {
        expect(typeof AtmosphericDustNode).toBe('function');
    });
});

describe('noise2D', () => {
    it('returns values in [-1, 1]', () => {
        for (let i = 0; i < 100; i++) {
            const v = noise2D(i * 0.37, i * 0.53);
            expect(v).toBeGreaterThanOrEqual(-1);
            expect(v).toBeLessThanOrEqual(1);
        }
    });

    it('is deterministic', () => {
        expect(noise2D(1.5, 2.3)).toBe(noise2D(1.5, 2.3));
    });

    it('varies smoothly (nearby inputs produce nearby outputs)', () => {
        const a = noise2D(1.0, 1.0);
        const b = noise2D(1.01, 1.0);
        expect(Math.abs(a - b)).toBeLessThan(0.1);
    });
});

describe('AtmosphericDustNode constants', () => {
    it('DUST_COUNT is positive and within pool headroom', () => {
        expect(DUST_COUNT).toBeGreaterThan(0);
        expect(DUST_COUNT).toBeLessThan(2000);
    });

    it('DUST_COLOR is a valid hex color', () => {
        expect(DUST_COLOR).toBeGreaterThan(0);
        expect(DUST_COLOR).toBeLessThanOrEqual(0xffffff);
    });

    it('DUST_SPEED range is valid', () => {
        expect(DUST_SPEED_MIN).toBeGreaterThanOrEqual(0);
        expect(DUST_SPEED_MAX).toBeGreaterThan(DUST_SPEED_MIN);
    });

    it('DUST_SIZE is positive', () => {
        expect(DUST_SIZE).toBeGreaterThan(0);
    });

    it('DUST_OPACITY is between 0 and 1', () => {
        expect(DUST_OPACITY).toBeGreaterThan(0);
        expect(DUST_OPACITY).toBeLessThanOrEqual(1);
    });

    it('DUST_SPAWN_Y is positive (above arena)', () => {
        expect(DUST_SPAWN_Y).toBeGreaterThan(0);
    });

    it('DUST_SPREAD values are positive', () => {
        expect(DUST_SPREAD_XZ).toBeGreaterThan(0);
        expect(DUST_SPREAD_Y).toBeGreaterThan(0);
    });

    it('DUST_PUSH_RADIUS is positive', () => {
        expect(DUST_PUSH_RADIUS).toBeGreaterThan(0);
    });

    it('DUST_PUSH_STRENGTH is positive', () => {
        expect(DUST_PUSH_STRENGTH).toBeGreaterThan(0);
    });

    it('DUST_DISP_ATTACK is faster than DUST_DISP_RELEASE', () => {
        expect(DUST_DISP_ATTACK).toBeGreaterThan(DUST_DISP_RELEASE);
    });

    it('DUST_TRAIL_DECAY is positive', () => {
        expect(DUST_TRAIL_DECAY).toBeGreaterThan(0);
    });

    it('DUST_FADE_DISTANCE is positive', () => {
        expect(DUST_FADE_DISTANCE).toBeGreaterThan(0);
    });

    it('DUST_ORBIT_STRENGTH is positive', () => {
        expect(DUST_ORBIT_STRENGTH).toBeGreaterThan(0);
    });

    it('DUST_NOISE_STRENGTH is positive', () => {
        expect(DUST_NOISE_STRENGTH).toBeGreaterThan(0);
    });

    it('DUST_SHIMMER_FREQ is positive', () => {
        expect(DUST_SHIMMER_FREQ).toBeGreaterThan(0);
    });

    it('DUST_SHIMMER_MIN is between 0 and 1', () => {
        expect(DUST_SHIMMER_MIN).toBeGreaterThanOrEqual(0);
        expect(DUST_SHIMMER_MIN).toBeLessThan(1);
    });

    it('DUST_SHIMMER_MAX_OPACITY is positive', () => {
        expect(DUST_SHIMMER_MAX_OPACITY).toBeGreaterThan(0);
        expect(DUST_SHIMMER_MAX_OPACITY).toBeGreaterThan(DUST_SHIMMER_MIN);
    });

    it('DUST_DISP_EMISSIVE_BOOST is positive', () => {
        expect(DUST_DISP_EMISSIVE_BOOST).toBeGreaterThan(0);
    });

    it('DUST_DISP_SIZE_BOOST is positive', () => {
        expect(DUST_DISP_SIZE_BOOST).toBeGreaterThan(0);
    });
});
