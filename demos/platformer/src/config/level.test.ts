import { level } from './level';

describe('level config', () => {
    it('has checkpoints array', () => {
        expect(Array.isArray(level.checkpoints)).toBe(true);
        expect(level.checkpoints.length).toBeGreaterThan(0);
    });

    it('has hazards array', () => {
        expect(Array.isArray(level.hazards)).toBe(true);
        expect(level.hazards.length).toBeGreaterThan(0);
    });

    it('each checkpoint has a 3-element position', () => {
        for (const cp of level.checkpoints) {
            expect(cp.position).toHaveLength(3);
            cp.position.forEach((v) => expect(typeof v).toBe('number'));
        }
    });

    it('each hazard has position and size tuples', () => {
        for (const h of level.hazards) {
            expect(h.position).toHaveLength(3);
            expect(h.size).toHaveLength(3);
            h.position.forEach((v) => expect(typeof v).toBe('number'));
            h.size.forEach((v) => expect(typeof v).toBe('number'));
        }
    });

    it('hazard sizes are all positive', () => {
        for (const h of level.hazards) {
            h.size.forEach((v) => expect(v).toBeGreaterThan(0));
        }
    });

    it('has enemies array', () => {
        expect(Array.isArray(level.enemies)).toBe(true);
        expect(level.enemies.length).toBeGreaterThan(0);
    });

    it('each enemy has position, target, and size tuples', () => {
        for (const e of level.enemies) {
            expect(e.position).toHaveLength(3);
            expect(e.target).toHaveLength(3);
            expect(e.size).toHaveLength(3);
            e.position.forEach((v) => expect(typeof v).toBe('number'));
            e.target.forEach((v) => expect(typeof v).toBe('number'));
            e.size.forEach((v) => expect(typeof v).toBe('number'));
        }
    });

    it('enemy sizes are all positive', () => {
        for (const e of level.enemies) {
            e.size.forEach((v) => expect(v).toBeGreaterThan(0));
        }
    });
});
