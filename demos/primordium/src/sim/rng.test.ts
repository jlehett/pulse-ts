import { createRng, hashSeed } from './rng';

describe('createRng', () => {
    it('is deterministic: same seed yields the same sequence', () => {
        const a = createRng(1234);
        const b = createRng(1234);
        const seqA = Array.from({ length: 20 }, () => a.next());
        const seqB = Array.from({ length: 20 }, () => b.next());
        expect(seqA).toEqual(seqB);
    });

    it('different seeds yield different sequences', () => {
        const a = createRng(1);
        const b = createRng(2);
        expect(a.next()).not.toEqual(b.next());
    });

    it('next() stays within [0, 1)', () => {
        const rng = createRng(99);
        for (let i = 0; i < 10000; i++) {
            const v = rng.next();
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThan(1);
        }
    });

    it('int(n) stays within [0, n)', () => {
        const rng = createRng(7);
        for (let i = 0; i < 10000; i++) {
            const v = rng.int(6);
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThan(6);
            expect(Number.isInteger(v)).toBe(true);
        }
    });

    it('int(n) covers the full range for small n', () => {
        const rng = createRng(7);
        const seen = new Set<number>();
        for (let i = 0; i < 1000; i++) seen.add(rng.int(4));
        expect([...seen].sort()).toEqual([0, 1, 2, 3]);
    });

    it('int(0) and negative return 0', () => {
        const rng = createRng(7);
        expect(rng.int(0)).toBe(0);
        expect(rng.int(-5)).toBe(0);
    });

    it('range(min, max) stays within bounds', () => {
        const rng = createRng(42);
        for (let i = 0; i < 10000; i++) {
            const v = rng.range(-3, 5);
            expect(v).toBeGreaterThanOrEqual(-3);
            expect(v).toBeLessThan(5);
        }
    });

    it('bool(p) respects probability roughly', () => {
        const rng = createRng(5);
        let trues = 0;
        const n = 20000;
        for (let i = 0; i < n; i++) if (rng.bool(0.25)) trues++;
        expect(trues / n).toBeCloseTo(0.25, 1);
    });

    it('pick returns an element and throws on empty', () => {
        const rng = createRng(5);
        const arr = ['a', 'b', 'c'] as const;
        for (let i = 0; i < 100; i++) expect(arr).toContain(rng.pick(arr));
        expect(() => rng.pick([])).toThrow();
    });

    it('fork produces an independent but reproducible substream', () => {
        const parent1 = createRng(1234);
        const parent2 = createRng(1234);
        const childA = parent1.fork();
        const childB = parent2.fork();
        // Same parent seed => same child stream.
        expect(Array.from({ length: 10 }, () => childA.next())).toEqual(
            Array.from({ length: 10 }, () => childB.next()),
        );
        // Parent still advances identically regardless of child draws.
        childA.next();
        expect(parent1.next()).toEqual(parent2.next());
    });

    it('state() snapshots and reproduces the stream', () => {
        const rng = createRng(2026);
        for (let i = 0; i < 5; i++) rng.next();
        const snapshot = rng.state();
        const expected = Array.from({ length: 5 }, () => rng.next());
        const resumed = createRng(snapshot);
        expect(Array.from({ length: 5 }, () => resumed.next())).toEqual(
            expected,
        );
    });
});

describe('hashSeed', () => {
    it('is deterministic', () => {
        expect(hashSeed('match-42')).toEqual(hashSeed('match-42'));
    });

    it('distinguishes different strings', () => {
        expect(hashSeed('a')).not.toEqual(hashSeed('b'));
    });

    it('produces a 32-bit unsigned integer', () => {
        const h = hashSeed('anything');
        expect(h).toBeGreaterThanOrEqual(0);
        expect(h).toBeLessThanOrEqual(0xffffffff);
        expect(Number.isInteger(h)).toBe(true);
    });
});
