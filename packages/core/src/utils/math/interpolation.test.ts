import {
    lerp,
    inverseLerp,
    damp,
    smoothstep,
    clamp,
    remap,
} from './interpolation';

describe('interpolation utilities', () => {
    describe('lerp', () => {
        test('interpolates at t=0, 0.5, 1', () => {
            expect(lerp(0, 100, 0)).toBe(0);
            expect(lerp(0, 100, 0.5)).toBe(50);
            expect(lerp(0, 100, 1)).toBe(100);
        });

        test('extrapolates beyond [0, 1]', () => {
            expect(lerp(0, 100, 1.5)).toBe(150);
            expect(lerp(0, 100, -0.5)).toBe(-50);
        });

        test('works with negative ranges', () => {
            expect(lerp(-10, 10, 0.5)).toBe(0);
        });

        test('returns a when a === b', () => {
            expect(lerp(5, 5, 0.5)).toBe(5);
        });
    });

    describe('inverseLerp', () => {
        test('returns normalized position', () => {
            expect(inverseLerp(0, 100, 50)).toBe(0.5);
            expect(inverseLerp(0, 100, 0)).toBe(0);
            expect(inverseLerp(0, 100, 100)).toBe(1);
        });

        test('clamps to [0, 1]', () => {
            expect(inverseLerp(0, 100, 150)).toBe(1);
            expect(inverseLerp(0, 100, -50)).toBe(0);
        });

        test('returns 0 when a === b (avoid division by zero)', () => {
            expect(inverseLerp(5, 5, 5)).toBe(0);
        });
    });

    describe('damp', () => {
        test('approaches target over time', () => {
            const result = damp(0, 100, 5, 0.016);
            expect(result).toBeGreaterThan(0);
            expect(result).toBeLessThan(100);
        });

        test('returns current when dt is 0', () => {
            expect(damp(50, 100, 10, 0)).toBe(50);
        });

        test('returns target when rate is very high', () => {
            const result = damp(0, 100, 10000, 1);
            expect(result).toBeCloseTo(100, 1);
        });

        test('is frame-rate independent', () => {
            // Two half-steps should approximate one full step
            const oneStep = damp(0, 100, 5, 0.032);
            const twoSteps = damp(damp(0, 100, 5, 0.016), 100, 5, 0.016);
            expect(twoSteps).toBeCloseTo(oneStep, 5);
        });
    });

    describe('smoothstep', () => {
        test('returns 0 below edge0', () => {
            expect(smoothstep(0, 1, -1)).toBe(0);
            expect(smoothstep(0, 1, 0)).toBe(0);
        });

        test('returns 1 above edge1', () => {
            expect(smoothstep(0, 1, 1)).toBe(1);
            expect(smoothstep(0, 1, 2)).toBe(1);
        });

        test('returns ~0.5 at midpoint', () => {
            expect(smoothstep(0, 1, 0.5)).toBe(0.5);
        });

        test('produces smooth S-curve (derivative is 0 at edges)', () => {
            // Values near edges should be closer to the edge than linear
            const near0 = smoothstep(0, 1, 0.1);
            const near1 = smoothstep(0, 1, 0.9);
            expect(near0).toBeLessThan(0.1); // slower than linear near 0
            expect(near1).toBeGreaterThan(0.9); // slower than linear near 1
        });

        test('works with custom edge range', () => {
            expect(smoothstep(10, 20, 15)).toBe(0.5);
            expect(smoothstep(10, 20, 5)).toBe(0);
            expect(smoothstep(10, 20, 25)).toBe(1);
        });
    });

    describe('clamp', () => {
        test('clamps below min', () => {
            expect(clamp(-5, 0, 10)).toBe(0);
        });

        test('clamps above max', () => {
            expect(clamp(15, 0, 10)).toBe(10);
        });

        test('returns value when in range', () => {
            expect(clamp(5, 0, 10)).toBe(5);
        });

        test('returns min when value equals min', () => {
            expect(clamp(0, 0, 10)).toBe(0);
        });

        test('returns max when value equals max', () => {
            expect(clamp(10, 0, 10)).toBe(10);
        });
    });

    describe('remap', () => {
        test('remaps value between ranges', () => {
            expect(remap(50, 0, 100, 0, 1)).toBe(0.5);
            expect(remap(15, 10, 20, 0, 100)).toBe(50);
        });

        test('handles inverted output range', () => {
            expect(remap(0, 0, 50, 1, 0)).toBe(1);
            expect(remap(50, 0, 50, 1, 0)).toBe(0);
            expect(remap(25, 0, 50, 1, 0)).toBe(0.5);
        });

        test('extrapolates beyond input range', () => {
            expect(remap(200, 0, 100, 0, 1)).toBe(2);
            expect(remap(-50, 0, 100, 0, 1)).toBe(-0.5);
        });

        test('handles same input and output ranges', () => {
            expect(remap(5, 0, 10, 0, 10)).toBe(5);
        });
    });
});
