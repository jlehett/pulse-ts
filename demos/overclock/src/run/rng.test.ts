import { createRng, randomSeedString, seedFromString } from './rng';

describe('rng', () => {
    it('produces identical sequences for identical seeds', () => {
        const a = createRng('OVR-TEST1');
        const b = createRng('OVR-TEST1');
        for (let i = 0; i < 100; i++) {
            expect(a.next()).toBe(b.next());
        }
    });

    it('produces different sequences for different seeds', () => {
        const a = createRng('OVR-TEST1');
        const b = createRng('OVR-TEST2');
        const seqA = Array.from({ length: 8 }, () => a.next());
        const seqB = Array.from({ length: 8 }, () => b.next());
        expect(seqA).not.toEqual(seqB);
    });

    it('stays within [0, 1) and int within [0, n)', () => {
        const rng = createRng(42);
        for (let i = 0; i < 1000; i++) {
            const v = rng.next();
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThan(1);
            const n = rng.int(7);
            expect(n).toBeGreaterThanOrEqual(0);
            expect(n).toBeLessThan(7);
        }
    });

    it('resumes exactly from saved state', () => {
        const a = createRng('OVR-SAVE');
        a.next();
        a.next();
        const saved = a.getState();
        const expected = [a.next(), a.next(), a.next()];

        const b = createRng(0);
        b.setState(saved);
        expect([b.next(), b.next(), b.next()]).toEqual(expected);
    });

    it('pick draws only from the array and throws on empty', () => {
        const rng = createRng(7);
        const items = ['a', 'b', 'c'];
        for (let i = 0; i < 50; i++) {
            expect(items).toContain(rng.pick(items));
        }
        expect(() => rng.pick([])).toThrow();
    });

    it('hashes distinct strings to distinct seeds (usually)', () => {
        expect(seedFromString('alpha')).not.toBe(seedFromString('beta'));
    });

    it('formats display seeds like OVR-XXXXX', () => {
        expect(randomSeedString(() => 0.5)).toMatch(/^OVR-[A-Z2-9]{5}$/);
    });
});
