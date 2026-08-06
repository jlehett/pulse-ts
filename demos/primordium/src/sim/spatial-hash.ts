/**
 * Uniform spatial hash grid for fast neighbor queries over a *continuous* 2D
 * world.
 *
 * Primordium's simulation hot path is "what food / prey / predators are within
 * vision radius" for thousands of agents every tick — an O(n²) scan is fatal.
 * This bins entities into cells so a radius query only inspects nearby cells.
 *
 * This is purely an **acceleration structure**: the world is grid-free and
 * entities have floating-point positions. Rebuild (or incrementally update) it
 * each fixed tick. Candidate to upstream into `@pulse-ts/core` once proven.
 */

// Cell coordinates are packed into a single collision-free integer key. BIAS
// offsets negatives into the non-negative range; STRIDE must exceed the biased
// range so the pairing is bijective. This supports cell coords in
// [-BIAS, STRIDE - BIAS - 1] = [-32768, 32767], i.e. a very large world.
const BIAS = 1 << 15;
const STRIDE = 1 << 16;
const MIN_CELL = -BIAS;
const MAX_CELL = STRIDE - BIAS - 1;

/** Callback for {@link SpatialHash.forEachInRadius}. */
export type NeighborVisitor = (id: number, dist2: number) => void;

/**
 * A uniform grid hashing entity ids by position for radius queries.
 *
 * @example
 * const grid = new SpatialHash(4); // bucket size ≈ max vision radius
 * grid.insert(1, 0, 0);
 * grid.insert(2, 3, 1);
 * grid.queryRadius(0, 0, 5); // [1, 2]
 */
export class SpatialHash {
    private readonly inv: number;
    private readonly ids: number[] = [];
    private readonly xs: number[] = [];
    private readonly ys: number[] = [];
    private readonly buckets = new Map<number, number[]>();

    /**
     * @param cellSize - Edge length of a bucket in world units. Choose roughly
     *   the largest query radius you expect (e.g. max vision), so queries touch a
     *   small, near-constant number of cells.
     */
    constructor(cellSize: number) {
        if (!(cellSize > 0)) {
            throw new Error(
                `SpatialHash: cellSize must be > 0, got ${cellSize}`,
            );
        }
        this.inv = 1 / cellSize;
    }

    /** Number of inserted entities since the last {@link clear}. */
    get size(): number {
        return this.ids.length;
    }

    /** Remove all entities. Call before rebuilding each tick. */
    clear(): void {
        this.ids.length = 0;
        this.xs.length = 0;
        this.ys.length = 0;
        this.buckets.clear();
    }

    private cellOf(v: number): number {
        const c = Math.floor(v * this.inv);
        if (c < MIN_CELL || c > MAX_CELL) {
            throw new Error(
                `SpatialHash: coordinate ${v} maps to out-of-range cell ${c}`,
            );
        }
        return c;
    }

    private key(cx: number, cy: number): number {
        return (cx + BIAS) * STRIDE + (cy + BIAS);
    }

    /**
     * Insert an entity at a continuous position. Ids need not be unique or
     * contiguous; the same id may be inserted multiple times (each is a separate
     * entry).
     */
    insert(id: number, x: number, y: number): void {
        const i = this.ids.length;
        this.ids.push(id);
        this.xs.push(x);
        this.ys.push(y);
        const k = this.key(this.cellOf(x), this.cellOf(y));
        let bucket = this.buckets.get(k);
        if (bucket === undefined) {
            bucket = [];
            this.buckets.set(k, bucket);
        }
        bucket.push(i);
    }

    /**
     * Visit every inserted entity whose position lies within `r` of `(x, y)`,
     * without allocating a result array. Preferred on the hot path.
     *
     * @param x - Query center x.
     * @param y - Query center y.
     * @param r - Query radius (world units).
     * @param visit - Called with each neighbor's id and squared distance.
     */
    forEachInRadius(
        x: number,
        y: number,
        r: number,
        visit: NeighborVisitor,
    ): void {
        if (r < 0) return;
        const r2 = r * r;
        const minCx = this.cellOf(x - r);
        const maxCx = this.cellOf(x + r);
        const minCy = this.cellOf(y - r);
        const maxCy = this.cellOf(y + r);
        for (let cx = minCx; cx <= maxCx; cx++) {
            for (let cy = minCy; cy <= maxCy; cy++) {
                const bucket = this.buckets.get(this.key(cx, cy));
                if (bucket === undefined) continue;
                for (let b = 0; b < bucket.length; b++) {
                    const i = bucket[b];
                    const dx = this.xs[i] - x;
                    const dy = this.ys[i] - y;
                    const d2 = dx * dx + dy * dy;
                    if (d2 <= r2) visit(this.ids[i], d2);
                }
            }
        }
    }

    /**
     * Collect the ids of every entity within `r` of `(x, y)`.
     *
     * @param out - Optional array to fill (cleared first) to avoid allocation.
     * @returns The ids within the radius (order unspecified).
     */
    queryRadius(x: number, y: number, r: number, out: number[] = []): number[] {
        out.length = 0;
        this.forEachInRadius(x, y, r, (id) => out.push(id));
        return out;
    }
}
