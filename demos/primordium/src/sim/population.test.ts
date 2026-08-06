import { Population } from './population';

describe('Population', () => {
    it('spawns organisms and tracks count', () => {
        const p = new Population(10);
        expect(p.count).toBe(0);
        const i = p.spawn(1, 2, 5, 0);
        expect(i).toBe(0);
        expect(p.count).toBe(1);
        expect(p.x[0]).toBe(1);
        expect(p.y[0]).toBe(2);
        expect(p.energy[0]).toBe(5);
        expect(p.alive[0]).toBe(1);
    });

    it('returns -1 at capacity', () => {
        const p = new Population(2);
        expect(p.spawn(0, 0, 1, 0)).toBe(0);
        expect(p.spawn(0, 0, 1, 0)).toBe(1);
        expect(p.spawn(0, 0, 1, 0)).toBe(-1);
        expect(p.count).toBe(2);
    });

    it('kill + compact removes dead and keeps survivors dense', () => {
        const p = new Population(10);
        for (let k = 0; k < 5; k++) p.spawn(k, 0, k, 0); // energies 0..4
        p.kill(1);
        p.kill(3);
        expect(p.liveCount()).toBe(3);
        p.compact();
        expect(p.count).toBe(3);
        // survivors were energies 0, 2, 4 in stable order
        expect([p.energy[0], p.energy[1], p.energy[2]]).toEqual([0, 2, 4]);
        expect([p.x[0], p.x[1], p.x[2]]).toEqual([0, 2, 4]);
    });

    it('compact with no deaths is a no-op', () => {
        const p = new Population(5);
        p.spawn(1, 1, 1, 0);
        p.spawn(2, 2, 2, 0);
        p.compact();
        expect(p.count).toBe(2);
        expect(p.x[0]).toBe(1);
        expect(p.x[1]).toBe(2);
    });

    it('reuses freed capacity after compaction', () => {
        const p = new Population(2);
        p.spawn(0, 0, 0, 0);
        p.spawn(0, 0, 0, 0);
        p.kill(0);
        p.compact();
        expect(p.count).toBe(1);
        expect(p.spawn(9, 9, 9, 0)).toBe(1); // capacity available again
        expect(p.count).toBe(2);
    });
});
