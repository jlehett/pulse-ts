import { combineFriction, combineRestitution, getFriction, getRestitution } from './materials';

describe('materials helpers', () => {
    const mkBody = (e?: number, f?: number) => ({ restitution: e, friction: f } as any);
    const mkCol = (e?: number, f?: number) => ({ restitution: e, friction: f } as any);

    it('getRestitution and getFriction use max(body, collider) or fallback', () => {
        expect(getRestitution(mkBody(0.1), mkCol(0.7))).toBeCloseTo(0.7);
        expect(getRestitution(mkBody(undefined), mkCol(undefined), 0.25)).toBeCloseTo(0.25);
        expect(getFriction(mkBody(undefined, 0.3), mkCol(undefined, 0.8))).toBeCloseTo(0.8);
    });

    it('combineRestitution uses max rule; combineFriction uses geometric mean', () => {
        const aB = mkBody(0.2, 0.5);
        const aC = mkCol(0.4, 0.6);
        const bB = mkBody(0.8, 0.9);
        const bC = mkCol(0.1, 0.2);
        expect(combineRestitution(aB, aC, bB, bC)).toBeCloseTo(0.8);
        const fA = Math.max(aB.friction!, aC.friction!);
        const fB = Math.max(bB.friction!, bC.friction!);
        expect(combineFriction(aB, aC, bB, bC)).toBeCloseTo(Math.sqrt(fA * fB));
    });
});
