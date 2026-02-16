import { shallowDelta } from './protocol';

describe('shallowDelta', () => {
    it('returns undefined for equal values', () => {
        expect(shallowDelta(1, 1)).toBeUndefined();
        expect(shallowDelta({ a: 1 }, { a: 1 })).toBeUndefined();
    });
    it('returns current for non-object diffs', () => {
        expect(shallowDelta(2, 1)).toBe(2);
        expect(shallowDelta('x', 'y')).toBe('x');
        expect(shallowDelta(null as any, { a: 1 } as any)).toBeNull();
    });
    it('returns changed keys only for objects', () => {
        const d = shallowDelta({ a: 1, b: 2 }, { a: 1, b: 0 });
        expect(d).toEqual({ b: 2 });
    });
});
