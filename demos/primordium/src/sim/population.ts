/**
 * The organism population as Structure-of-Arrays (SoA).
 *
 * Thousands of organisms exist, so they are flat typed arrays rather than
 * objects/nodes. Deaths are marked (`alive = 0`) during a tick and swept out by
 * {@link compact} at the end, keeping live organisms dense in `[0, count)` for
 * cache-friendly iteration. Newborns append at the end and are (by convention)
 * not processed until the next tick.
 */
export class Population {
    readonly capacity: number;
    /** Number of slots in use (live + freshly dead, until the next compact). */
    count = 0;

    readonly x: Float32Array;
    readonly y: Float32Array;
    readonly vx: Float32Array;
    readonly vy: Float32Array;
    readonly energy: Float32Array;
    readonly age: Float32Array;
    /** Per-organism reproduction cooldown timer (seconds remaining). */
    readonly repro: Float32Array;
    /** Per-organism attack/feed cooldown timer (seconds remaining). */
    readonly atk: Float32Array;
    readonly caste: Uint16Array;
    readonly alive: Uint8Array;

    constructor(capacity: number) {
        this.capacity = capacity;
        this.x = new Float32Array(capacity);
        this.y = new Float32Array(capacity);
        this.vx = new Float32Array(capacity);
        this.vy = new Float32Array(capacity);
        this.energy = new Float32Array(capacity);
        this.age = new Float32Array(capacity);
        this.repro = new Float32Array(capacity);
        this.atk = new Float32Array(capacity);
        this.caste = new Uint16Array(capacity);
        this.alive = new Uint8Array(capacity);
    }

    /**
     * Add an organism. Returns its slot index, or -1 if at capacity.
     */
    spawn(
        x: number,
        y: number,
        energy: number,
        caste: number,
        repro = 0,
    ): number {
        if (this.count >= this.capacity) return -1;
        const i = this.count++;
        this.x[i] = x;
        this.y[i] = y;
        this.vx[i] = 0;
        this.vy[i] = 0;
        this.energy[i] = energy;
        this.age[i] = 0;
        this.repro[i] = repro;
        this.atk[i] = 0;
        this.caste[i] = caste;
        this.alive[i] = 1;
        return i;
    }

    /** Mark an organism dead. Removed on the next {@link compact}. */
    kill(i: number): void {
        this.alive[i] = 0;
    }

    /** Number of currently-alive organisms (may be < count before a compact). */
    liveCount(): number {
        let n = 0;
        for (let i = 0; i < this.count; i++) if (this.alive[i]) n++;
        return n;
    }

    /**
     * Sweep out dead organisms, keeping the living dense in `[0, count)`.
     * Two-pointer compaction; stable order among survivors.
     */
    compact(): void {
        let w = 0;
        for (let r = 0; r < this.count; r++) {
            if (!this.alive[r]) continue;
            if (w !== r) {
                this.x[w] = this.x[r];
                this.y[w] = this.y[r];
                this.vx[w] = this.vx[r];
                this.vy[w] = this.vy[r];
                this.energy[w] = this.energy[r];
                this.age[w] = this.age[r];
                this.repro[w] = this.repro[r];
                this.atk[w] = this.atk[r];
                this.caste[w] = this.caste[r];
                this.alive[w] = 1;
            }
            w++;
        }
        this.count = w;
    }
}
