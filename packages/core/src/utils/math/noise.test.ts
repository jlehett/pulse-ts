import { noise2D, noise3D, fbm2D, curlNoise2D } from './noise';

describe('noise2D', () => {
    test('returns values in [-1, 1]', () => {
        for (let i = 0; i < 1000; i++) {
            const x = ((i * 0.37) % 100) - 50;
            const y = ((i * 0.53) % 100) - 50;
            const n = noise2D(x, y);
            expect(n).toBeGreaterThanOrEqual(-1);
            expect(n).toBeLessThanOrEqual(1);
        }
    });

    test('is deterministic — same inputs produce same output', () => {
        const a = noise2D(1.5, 2.7);
        const b = noise2D(1.5, 2.7);
        expect(a).toBe(b);
    });

    test('varies across different inputs', () => {
        const values = new Set<number>();
        for (let i = 0; i < 20; i++) {
            values.add(noise2D(i * 1.1, i * 0.7));
        }
        // Should produce many distinct values
        expect(values.size).toBeGreaterThan(10);
    });

    test('returns 0 at the origin', () => {
        // Simplex noise at (0,0) is always 0 due to gradient dot product
        expect(noise2D(0, 0)).toBe(0);
    });
});

describe('noise3D', () => {
    test('returns values in [-1, 1]', () => {
        for (let i = 0; i < 1000; i++) {
            const x = ((i * 0.37) % 100) - 50;
            const y = ((i * 0.53) % 100) - 50;
            const z = ((i * 0.71) % 100) - 50;
            const n = noise3D(x, y, z);
            expect(n).toBeGreaterThanOrEqual(-1);
            expect(n).toBeLessThanOrEqual(1);
        }
    });

    test('is deterministic', () => {
        const a = noise3D(1.5, 2.7, 3.2);
        const b = noise3D(1.5, 2.7, 3.2);
        expect(a).toBe(b);
    });

    test('varies across different inputs', () => {
        const values = new Set<number>();
        for (let i = 0; i < 20; i++) {
            values.add(noise3D(i * 1.1, i * 0.7, i * 0.3));
        }
        expect(values.size).toBeGreaterThan(10);
    });

    test('returns 0 at the origin', () => {
        expect(noise3D(0, 0, 0)).toBe(0);
    });
});

describe('fbm2D', () => {
    test('returns deterministic values', () => {
        const a = fbm2D(3.5, 7.2);
        const b = fbm2D(3.5, 7.2);
        expect(a).toBe(b);
    });

    test('uses default options when none provided', () => {
        // Should not throw and should return a number
        const n = fbm2D(1, 2);
        expect(typeof n).toBe('number');
        expect(isNaN(n)).toBe(false);
    });

    test('more octaves produce different results', () => {
        const a = fbm2D(5, 5, { octaves: 1 });
        const b = fbm2D(5, 5, { octaves: 6 });
        expect(a).not.toBe(b);
    });

    test('single octave equals raw noise2D', () => {
        const x = 3.14;
        const y = 2.71;
        const fbm = fbm2D(x, y, { octaves: 1 });
        const raw = noise2D(x, y);
        expect(fbm).toBeCloseTo(raw, 10);
    });

    test('respects persistence parameter', () => {
        const a = fbm2D(5, 5, { persistence: 0.3 });
        const b = fbm2D(5, 5, { persistence: 0.9 });
        // Different persistence should yield different results
        expect(a).not.toBe(b);
    });

    test('respects lacunarity parameter', () => {
        const a = fbm2D(5, 5, { lacunarity: 1.5 });
        const b = fbm2D(5, 5, { lacunarity: 3.0 });
        expect(a).not.toBe(b);
    });
});

describe('curlNoise2D', () => {
    test('returns a 2-element tuple', () => {
        const result = curlNoise2D(1, 2);
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(2);
        expect(typeof result[0]).toBe('number');
        expect(typeof result[1]).toBe('number');
    });

    test('is deterministic', () => {
        const a = curlNoise2D(3.5, 7.2, { epsilon: 0.5, scale: 0.3 });
        const b = curlNoise2D(3.5, 7.2, { epsilon: 0.5, scale: 0.3 });
        expect(a[0]).toBe(b[0]);
        expect(a[1]).toBe(b[1]);
    });

    test('produces non-zero displacement for non-trivial inputs', () => {
        const [dx, dz] = curlNoise2D(5.5, 3.3, { scale: 0.3 });
        const magnitude = Math.sqrt(dx * dx + dz * dz);
        expect(magnitude).toBeGreaterThan(0);
    });

    test('is approximately divergence-free', () => {
        // Numerical test: divergence of curl field should be ≈ 0
        // div(F) = dFx/dx + dFz/dz
        const e = 0.001;
        const x = 5.0;
        const z = 3.0;
        const opts = { epsilon: 0.01, scale: 0.5 };

        const [fxR] = curlNoise2D(x + e, z, opts);
        const [fxL] = curlNoise2D(x - e, z, opts);
        const dFxDx = (fxR - fxL) / (2 * e);

        const [, fzU] = curlNoise2D(x, z + e, opts);
        const [, fzD] = curlNoise2D(x, z - e, opts);
        const dFzDz = (fzU - fzD) / (2 * e);

        const divergence = dFxDx + dFzDz;
        expect(Math.abs(divergence)).toBeLessThan(0.1);
    });

    test('respects scale parameter', () => {
        const a = curlNoise2D(5, 5, { scale: 0.1 });
        const b = curlNoise2D(5, 5, { scale: 2.0 });
        // Different scale should yield different displacements
        expect(a[0]).not.toBe(b[0]);
    });
});
