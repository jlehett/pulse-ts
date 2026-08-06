import { SpatialHash } from './spatial-hash';

/** Brute-force reference: ids within r of (x,y). */
function brute(
    pts: Array<{ id: number; x: number; y: number }>,
    x: number,
    y: number,
    r: number,
): number[] {
    const r2 = r * r;
    return pts
        .filter((p) => {
            const dx = p.x - x;
            const dy = p.y - y;
            return dx * dx + dy * dy <= r2;
        })
        .map((p) => p.id)
        .sort((a, b) => a - b);
}

describe('SpatialHash', () => {
    it('rejects a non-positive cell size', () => {
        expect(() => new SpatialHash(0)).toThrow();
        expect(() => new SpatialHash(-1)).toThrow();
    });

    it('finds entities within radius and excludes those outside', () => {
        const grid = new SpatialHash(4);
        grid.insert(1, 0, 0);
        grid.insert(2, 3, 1); // dist ~3.16
        grid.insert(3, 10, 10); // far
        const ids = grid.queryRadius(0, 0, 5).sort((a, b) => a - b);
        expect(ids).toEqual([1, 2]);
    });

    it('respects the radius boundary (inclusive)', () => {
        const grid = new SpatialHash(4);
        grid.insert(1, 3, 4); // dist exactly 5
        expect(grid.queryRadius(0, 0, 5)).toEqual([1]);
        expect(grid.queryRadius(0, 0, 4.999)).toEqual([]);
    });

    it('handles multiple entities in the same cell', () => {
        const grid = new SpatialHash(10);
        grid.insert(1, 1, 1);
        grid.insert(2, 2, 2);
        grid.insert(3, 3, 3);
        expect(grid.queryRadius(0, 0, 100).sort((a, b) => a - b)).toEqual([
            1, 2, 3,
        ]);
    });

    it('handles negative coordinates', () => {
        const grid = new SpatialHash(4);
        grid.insert(1, -10, -10);
        grid.insert(2, -11, -9);
        grid.insert(3, 50, 50);
        expect(grid.queryRadius(-10, -10, 3).sort((a, b) => a - b)).toEqual([
            1, 2,
        ]);
    });

    it('returns nothing from an empty grid', () => {
        const grid = new SpatialHash(4);
        expect(grid.queryRadius(0, 0, 100)).toEqual([]);
    });

    it('clear() empties the grid', () => {
        const grid = new SpatialHash(4);
        grid.insert(1, 0, 0);
        expect(grid.size).toBe(1);
        grid.clear();
        expect(grid.size).toBe(0);
        expect(grid.queryRadius(0, 0, 100)).toEqual([]);
    });

    it('forEachInRadius reports correct squared distances', () => {
        const grid = new SpatialHash(4);
        grid.insert(7, 3, 4);
        const seen: Array<[number, number]> = [];
        grid.forEachInRadius(0, 0, 10, (id, d2) => seen.push([id, d2]));
        expect(seen).toEqual([[7, 25]]);
    });

    it('does not return duplicates when the query spans many cells', () => {
        const grid = new SpatialHash(1); // tiny cells => query spans many
        grid.insert(1, 0, 0);
        grid.insert(2, 5, 5);
        const ids = grid.queryRadius(0, 0, 20);
        expect(ids.filter((id) => id === 1).length).toBe(1);
        expect(ids.filter((id) => id === 2).length).toBe(1);
    });

    it('matches a brute-force reference over random points', () => {
        // Deterministic LCG so the test itself is reproducible.
        let s = 123456789;
        const rand = () => {
            s = (Math.imul(s, 1103515245) + 12345) & 0x7fffffff;
            return s / 0x7fffffff;
        };
        const pts = Array.from({ length: 500 }, (_, i) => ({
            id: i,
            x: rand() * 200 - 100,
            y: rand() * 200 - 100,
        }));
        const grid = new SpatialHash(8);
        for (const p of pts) grid.insert(p.id, p.x, p.y);

        for (let q = 0; q < 50; q++) {
            const qx = rand() * 200 - 100;
            const qy = rand() * 200 - 100;
            const r = rand() * 30;
            const got = grid.queryRadius(qx, qy, r).sort((a, b) => a - b);
            expect(got).toEqual(brute(pts, qx, qy, r));
        }
    });
});
