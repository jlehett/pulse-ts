/**
 * Hex-grid math for the 8x7 battle board.
 *
 * The board uses "odd-r" offset coordinates: rows 0-7 top (enemy) to
 * bottom (player), columns 0-6, with odd rows shifted +half a hex in x.
 * Row 0-3 is the enemy half, 4-7 the player half.
 */

export const BOARD_ROWS = 8;
export const BOARD_COLS = 7;
/** First row of the player half. */
export const PLAYER_ROW_START = 4;

/** A board cell in offset coordinates. */
export interface Cell {
    row: number;
    col: number;
}

/** Returns true when the cell lies on the board. */
export function inBounds(row: number, col: number): boolean {
    return row >= 0 && row < BOARD_ROWS && col >= 0 && col < BOARD_COLS;
}

/** Returns true when the cell lies in the player-deployable half. */
export function isPlayerCell(row: number, col: number): boolean {
    return inBounds(row, col) && row >= PLAYER_ROW_START;
}

/** Packs a cell into a single integer key for Set/Map use. */
export function cellKey(row: number, col: number): number {
    return row * BOARD_COLS + col;
}

/** Reverses {@link cellKey}. */
export function keyCell(key: number): Cell {
    return { row: Math.floor(key / BOARD_COLS), col: key % BOARD_COLS };
}

/** Odd-r offset neighbor deltas, indexed by row parity. */
const NEIGHBORS_EVEN: ReadonlyArray<readonly [number, number]> = [
    [0, 1],
    [0, -1],
    [-1, 0],
    [-1, -1],
    [1, 0],
    [1, -1],
];
const NEIGHBORS_ODD: ReadonlyArray<readonly [number, number]> = [
    [0, 1],
    [0, -1],
    [-1, 1],
    [-1, 0],
    [1, 1],
    [1, 0],
];

/**
 * Returns the in-bounds neighbors of a cell.
 *
 * @param row - Cell row.
 * @param col - Cell column.
 * @returns Array of neighboring cells (2-6 entries).
 */
export function neighbors(row: number, col: number): Cell[] {
    const deltas = row % 2 === 0 ? NEIGHBORS_EVEN : NEIGHBORS_ODD;
    const out: Cell[] = [];
    for (const [dr, dc] of deltas) {
        const r = row + dr;
        const c = col + dc;
        if (inBounds(r, c)) out.push({ row: r, col: c });
    }
    return out;
}

/** Converts odd-r offset coordinates to cube coordinates. */
function toCube(row: number, col: number): [number, number, number] {
    const x = col - (row - (row & 1)) / 2;
    const z = row;
    return [x, -x - z, z];
}

/**
 * Hex distance between two cells.
 *
 * @example
 * hexDistance(0, 0, 0, 3); // 3
 */
export function hexDistance(
    r1: number,
    c1: number,
    r2: number,
    c2: number,
): number {
    const [ax, ay, az] = toCube(r1, c1);
    const [bx, by, bz] = toCube(r2, c2);
    return Math.max(Math.abs(ax - bx), Math.abs(ay - by), Math.abs(az - bz));
}

/**
 * Picks the best free neighbor cell to step toward a goal, or null when no
 * step improves distance (or all improved cells are occupied).
 *
 * @param from - Current cell.
 * @param goal - Cell to approach.
 * @param occupied - Set of {@link cellKey} values that cannot be entered.
 * @returns The chosen neighbor, or null.
 */
export function stepToward(
    from: Cell,
    goal: Cell,
    occupied: ReadonlySet<number>,
): Cell | null {
    const current = hexDistance(from.row, from.col, goal.row, goal.col);
    let best: Cell | null = null;
    let bestDist = current;
    for (const n of neighbors(from.row, from.col)) {
        if (occupied.has(cellKey(n.row, n.col))) continue;
        const d = hexDistance(n.row, n.col, goal.row, goal.col);
        if (d < bestDist) {
            bestDist = d;
            best = n;
        }
    }
    return best;
}

/**
 * World-space position of a cell center, matching the visual board layout.
 * X spans columns, Z spans rows (player half at +Z, toward the camera).
 *
 * @param row - Cell row.
 * @param col - Cell column.
 * @param hexRadius - Circumradius of a hex tile.
 * @returns `[x, z]` world coordinates.
 */
export function cellToWorld(
    row: number,
    col: number,
    hexRadius = 1,
): [number, number] {
    const s = Math.sqrt(3) * hexRadius;
    const x = (col - 3) * s + (row % 2 === 1 ? s / 2 : 0) - s / 4;
    const z = (row - 3.5) * 1.5 * hexRadius;
    return [x, z];
}

/**
 * Cells within `radius` hexes of a center (including the center).
 */
export function cellsWithin(row: number, col: number, radius: number): Cell[] {
    const out: Cell[] = [];
    for (let r = 0; r < BOARD_ROWS; r++) {
        for (let c = 0; c < BOARD_COLS; c++) {
            if (hexDistance(row, col, r, c) <= radius)
                out.push({ row: r, col: c });
        }
    }
    return out;
}
