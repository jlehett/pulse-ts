import {
    BOARD_COLS,
    BOARD_ROWS,
    cellKey,
    cellToWorld,
    cellsWithin,
    hexDistance,
    inBounds,
    isPlayerCell,
    keyCell,
    neighbors,
    stepToward,
} from './grid';

describe('grid', () => {
    it('bounds the 8x7 board', () => {
        expect(inBounds(0, 0)).toBe(true);
        expect(inBounds(BOARD_ROWS - 1, BOARD_COLS - 1)).toBe(true);
        expect(inBounds(-1, 0)).toBe(false);
        expect(inBounds(0, BOARD_COLS)).toBe(false);
    });

    it('identifies the player half', () => {
        expect(isPlayerCell(4, 0)).toBe(true);
        expect(isPlayerCell(7, 6)).toBe(true);
        expect(isPlayerCell(3, 3)).toBe(false);
    });

    it('round-trips cell keys', () => {
        for (const [row, col] of [
            [0, 0],
            [3, 6],
            [7, 2],
        ]) {
            expect(keyCell(cellKey(row, col))).toEqual({ row, col });
        }
    });

    it('gives 6 neighbors for interior cells and fewer at edges', () => {
        expect(neighbors(3, 3)).toHaveLength(6);
        expect(neighbors(4, 3)).toHaveLength(6);
        expect(neighbors(0, 0).length).toBeLessThan(6);
    });

    it('neighbors are all at distance 1', () => {
        for (const row of [2, 3]) {
            for (const n of neighbors(row, 3)) {
                expect(hexDistance(row, 3, n.row, n.col)).toBe(1);
            }
        }
    });

    it('computes hex distances', () => {
        expect(hexDistance(0, 0, 0, 3)).toBe(3);
        expect(hexDistance(2, 2, 2, 2)).toBe(0);
        // Adjacent diagonal on odd row.
        expect(hexDistance(1, 1, 2, 1)).toBe(1);
        // Straight down columns zig-zag: 2 rows apart is distance 2.
        expect(hexDistance(0, 3, 2, 3)).toBe(2);
    });

    it('is symmetric', () => {
        expect(hexDistance(1, 2, 6, 5)).toBe(hexDistance(6, 5, 1, 2));
    });

    it('steps toward a goal, avoiding occupied cells', () => {
        const from = { row: 7, col: 3 };
        const goal = { row: 0, col: 3 };
        const step = stepToward(from, goal, new Set());
        expect(step).not.toBeNull();
        expect(
            hexDistance(step!.row, step!.col, goal.row, goal.col),
        ).toBeLessThan(hexDistance(from.row, from.col, goal.row, goal.col));
    });

    it('returns null when boxed in', () => {
        const from = { row: 3, col: 3 };
        const goal = { row: 0, col: 3 };
        const occupied = new Set(
            neighbors(3, 3).map((n) => cellKey(n.row, n.col)),
        );
        expect(stepToward(from, goal, occupied)).toBeNull();
    });

    it('cellsWithin includes center and respects radius', () => {
        const cells = cellsWithin(3, 3, 1);
        expect(cells).toContainEqual({ row: 3, col: 3 });
        expect(cells).toHaveLength(7); // center + 6 neighbors
        for (const c of cells) {
            expect(hexDistance(3, 3, c.row, c.col)).toBeLessThanOrEqual(1);
        }
    });

    it('maps cells to world space with odd-row offset', () => {
        const [x0] = cellToWorld(0, 3);
        const [x1] = cellToWorld(1, 3);
        expect(x1).toBeGreaterThan(x0); // odd rows shift +x
        const [, zTop] = cellToWorld(0, 3);
        const [, zBottom] = cellToWorld(7, 3);
        expect(zBottom).toBeGreaterThan(zTop); // player half toward +z
    });
});
