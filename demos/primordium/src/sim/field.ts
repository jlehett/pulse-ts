/**
 * A continuous scalar resource field (light, nutrient, hazard, …).
 *
 * Stored as a coarse lattice of cell values but **sampled continuously** via
 * bilinear interpolation, so gameplay never snaps to a cell. Cell centers sit at
 * `((i + 0.5) * cellSize, (j + 0.5) * cellSize)`. The field covers the world rect
 * `[0, cols*cellSize] × [0, rows*cellSize]`; out-of-bounds samples clamp to the
 * edge.
 */
export class ScalarField {
    readonly cols: number;
    readonly rows: number;
    readonly cellSize: number;
    readonly values: Float32Array;
    /** Upper bound each cell regenerates toward. */
    readonly cap: number;

    constructor(
        cols: number,
        rows: number,
        cellSize: number,
        initial: number,
        cap: number,
    ) {
        this.cols = cols;
        this.rows = rows;
        this.cellSize = cellSize;
        this.cap = cap;
        this.values = new Float32Array(cols * rows).fill(initial);
    }

    /** World width/height covered by the field. */
    get width(): number {
        return this.cols * this.cellSize;
    }
    get height(): number {
        return this.rows * this.cellSize;
    }

    private idx(i: number, j: number): number {
        return j * this.cols + i;
    }

    /**
     * Resolve a world position to interpolation cell indices and fractions,
     * clamped to the lattice.
     */
    private locate(x: number, y: number) {
        let gx = x / this.cellSize - 0.5;
        let gy = y / this.cellSize - 0.5;
        if (gx < 0) gx = 0;
        else if (gx > this.cols - 1) gx = this.cols - 1;
        if (gy < 0) gy = 0;
        else if (gy > this.rows - 1) gy = this.rows - 1;
        const i0 = Math.floor(gx);
        const j0 = Math.floor(gy);
        const i1 = Math.min(i0 + 1, this.cols - 1);
        const j1 = Math.min(j0 + 1, this.rows - 1);
        const fx = gx - i0;
        const fy = gy - j0;
        return { i0, j0, i1, j1, fx, fy };
    }

    /** Bilinearly sample the field at a continuous position. */
    sample(x: number, y: number): number {
        const { i0, j0, i1, j1, fx, fy } = this.locate(x, y);
        const v = this.values;
        const v00 = v[this.idx(i0, j0)];
        const v10 = v[this.idx(i1, j0)];
        const v01 = v[this.idx(i0, j1)];
        const v11 = v[this.idx(i1, j1)];
        const a = v00 * (1 - fx) + v10 * fx;
        const b = v01 * (1 - fx) + v11 * fx;
        return a * (1 - fy) + b * fy;
    }

    /**
     * Try to consume up to `want` from the field at a position. Removes the taken
     * amount, distributed bilinearly across the four surrounding cells (clamped at
     * zero), and returns how much was actually taken.
     */
    consume(x: number, y: number, want: number): number {
        if (want <= 0) return 0;
        const available = this.sample(x, y);
        const taken = Math.min(available, want);
        if (taken > 0) this.splat(x, y, -taken);
        return taken;
    }

    /** Add `amount` to the field at a position (bilinear splat, clamped ≥ 0). */
    deposit(x: number, y: number, amount: number): void {
        this.splat(x, y, amount);
    }

    private splat(x: number, y: number, amount: number): void {
        const { i0, j0, i1, j1, fx, fy } = this.locate(x, y);
        const v = this.values;
        const w00 = (1 - fx) * (1 - fy);
        const w10 = fx * (1 - fy);
        const w01 = (1 - fx) * fy;
        const w11 = fx * fy;
        const add = (i: number, j: number, w: number) => {
            const k = this.idx(i, j);
            const nv = v[k] + amount * w;
            v[k] = nv < 0 ? 0 : nv;
        };
        add(i0, j0, w00);
        add(i1, j0, w10);
        add(i0, j1, w01);
        add(i1, j1, w11);
    }

    /** Regenerate every cell toward `cap` at `rate` units/second. */
    regen(dt: number, rate: number): void {
        const step = rate * dt;
        const v = this.values;
        const cap = this.cap;
        for (let k = 0; k < v.length; k++) {
            const nv = v[k] + step;
            v[k] = nv > cap ? cap : nv;
        }
    }

    /** Sum of all cell values (diagnostics/tests). */
    total(): number {
        let s = 0;
        const v = this.values;
        for (let k = 0; k < v.length; k++) s += v[k];
        return s;
    }
}
