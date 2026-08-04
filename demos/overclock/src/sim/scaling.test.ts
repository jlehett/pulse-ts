import { resolveScaling } from './scaling';

describe('resolveScaling', () => {
    const inputs = { star: 1, atk: 55, armor: 20, maxHp: 500, ap: 1 };

    it('resolves a flat base', () => {
        expect(resolveScaling(inputs, { base: 60 })).toBe(60);
    });

    it('star-scales only the base portion', () => {
        expect(resolveScaling({ ...inputs, star: 2 }, { base: 60 })).toBe(108);
        expect(
            resolveScaling({ ...inputs, star: 2, atk: 100 }, { adRatio: 1 }),
        ).toBe(100);
    });

    it('adds stat ratio contributions', () => {
        expect(resolveScaling(inputs, { base: 60, adRatio: 1.45 })).toBeCloseTo(
            139.75,
        );
        expect(resolveScaling(inputs, { armorRatio: 2 })).toBe(40);
        expect(resolveScaling(inputs, { hpRatio: 0.1 })).toBe(50);
    });

    it('multiplies by AP only when apScaled is set', () => {
        const boosted = { ...inputs, ap: 1.3 };
        expect(resolveScaling(boosted, { base: 100 })).toBe(100);
        expect(
            resolveScaling(boosted, { base: 100, apScaled: true }),
        ).toBeCloseTo(130);
    });

    it('returns 0 for an empty expression', () => {
        expect(resolveScaling(inputs, {})).toBe(0);
    });
});
