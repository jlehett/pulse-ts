import { ScalarField } from './field';

describe('ScalarField', () => {
    it('samples a uniform field as that value everywhere', () => {
        const f = new ScalarField(8, 8, 2, 0.5, 1);
        expect(f.sample(0, 0)).toBeCloseTo(0.5);
        expect(f.sample(7.3, 11.1)).toBeCloseTo(0.5);
        expect(f.sample(-100, 999)).toBeCloseTo(0.5); // clamps to edge
    });

    it('returns a cell value exactly at its center', () => {
        const f = new ScalarField(4, 4, 10, 0, 5);
        // cell (2,1) center = ((2+0.5)*10, (1+0.5)*10) = (25, 15)
        f.values[1 * 4 + 2] = 3;
        expect(f.sample(25, 15)).toBeCloseTo(3);
    });

    it('interpolates between adjacent cells', () => {
        const f = new ScalarField(4, 1, 10, 0, 5);
        f.values[0] = 0;
        f.values[1] = 10;
        // halfway between cell centers (5 and 15) is x=10 -> value 5
        expect(f.sample(10, 5)).toBeCloseTo(5);
    });

    it('consume takes min(available, want) and reduces the total', () => {
        const f = new ScalarField(4, 4, 5, 1, 1);
        const before = f.total();
        const taken = f.consume(10, 10, 0.3);
        expect(taken).toBeCloseTo(0.3);
        expect(f.total()).toBeCloseTo(before - 0.3, 5);
    });

    it('consume cannot take more than is present, and conserves the total', () => {
        const f = new ScalarField(4, 4, 5, 0.2, 1);
        const before = f.total();
        // want far exceeds what's here: take is capped at the sampled amount.
        const taken = f.consume(10, 10, 5);
        expect(taken).toBeCloseTo(0.2);
        // Exactly `taken` leaves the field total (bilinear removal is conservative)...
        expect(f.total()).toBeCloseTo(before - taken, 5);
        // ...and the local sample drops (though not necessarily to zero, since the
        // removal is spread across the four surrounding cells).
        expect(f.sample(10, 10)).toBeLessThan(0.2);
    });

    it('regen raises cells toward cap but not beyond', () => {
        const f = new ScalarField(2, 2, 1, 0.9, 1);
        f.regen(1, 0.05);
        expect(f.values[0]).toBeCloseTo(0.95);
        f.regen(1, 1); // would overshoot
        expect(f.values[0]).toBeCloseTo(1);
    });

    it('deposit adds and never goes negative', () => {
        const f = new ScalarField(4, 4, 5, 0, 10);
        f.deposit(10, 10, 2);
        expect(f.sample(10, 10)).toBeGreaterThan(0);
        f.deposit(10, 10, -1000);
        expect(f.sample(10, 10)).toBeGreaterThanOrEqual(0);
    });
});
