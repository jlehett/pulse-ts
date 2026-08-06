import { ScalarField } from './field';
import { Population } from './population';
import { SpatialHash } from './spatial-hash';
import type { Rng } from './rng';
import type { Caste, EcosystemConfig } from './types';

/** Neighbor-sense modes for {@link Ecosystem}'s reusable query. */
const SENSE_PREY = 0;
const SENSE_THREAT = 1;

// Evolutionary Pressure accrues from population *turnover*, not standing mass —
// so a churning/struggling lineage evolves faster than a fat, static one.
const BIRTH_WEIGHT = 1;
const DEATH_WEIGHT = 1;
const KILL_WEIGHT = 2;

// Separation ("personal space"): agents steer away from close neighbours so they
// spread out instead of overlapping and phasing through each other.
const SEP_RADIUS_PER_SIZE = 3.5; // separation radius ≈ this × body size
const SEP_MIN_RADIUS = 5;
const SEP_WEIGHT = 1.6; // how strongly separation bends steering

// Fraction of the way velocity eases toward its target each tick (momentum) —
// lower is smoother/heavier, higher is snappier. Tames per-tick jitter.
const STEER_EASING = 0.25;

// Backward velocity impulse a predator gets when it lands a kill (visible lurch).
const COMBAT_KNOCKBACK = 6;

/**
 * The headless ecosystem: a continuous world, a light field, and a population of
 * steering agents driven by their caste. Deterministic given `(config, castes,
 * rng, seeding)` — the whole point, so matches and tests are reproducible.
 *
 * Each fixed `step()` runs: field regen → rebuild the neighbor grid → agent pass
 * (upkeep, feed, sense, steer, move, reproduce, age/die) → compaction. Photo
 * castes graze the light field and flee predators; carnivore castes hunt and eat
 * organisms smaller than themselves. No rendering; drive it from a manual loop or
 * a test.
 */
export class Ecosystem {
    readonly config: EcosystemConfig;
    /** Compiled genome per caste. Grows at runtime as splits create castes. */
    readonly castes: Caste[];
    /** Lineage (player/AI) that owns each caste, indexed by caste. */
    readonly lineageOf: number[];
    readonly light: ScalarField;
    readonly pop: Population;
    readonly grid: SpatialHash;
    /** A finer grid, sized for the small separation radius, so those queries are fast. */
    readonly sepGrid: SpatialHash;
    private readonly rng: Rng;
    /** Unspent Evolutionary Pressure accrued from turnover, indexed by lineage. */
    private readonly turnover: number[];
    /** Simulated seconds elapsed. */
    time = 0;

    /**
     * When true, positions of organisms that die are recorded into
     * {@link deathX}/{@link deathY}/{@link deathCaste} so a renderer can animate a
     * fade-out (the sim otherwise removes the dead immediately). Off by default so
     * headless runs pay nothing. Drain with {@link clearDeaths} each frame.
     */
    recordDeaths = false;
    readonly deathX: number[] = [];
    readonly deathY: number[] = [];
    readonly deathCaste: number[] = [];
    /** Positions of combat kills this frame, for a renderer to flash. */
    readonly hitX: number[] = [];
    readonly hitY: number[] = [];

    // Reusable neighbor-sense scratch, to avoid allocating a closure per query.
    private senseMode = SENSE_PREY;
    private senseSelf = -1;
    private senseSelfSize = 0;
    private bestIdx = -1;
    private bestD2 = Infinity;
    private readonly visit: (id: number, d2: number) => void;

    // Reusable steering-direction output, to avoid allocating a tuple per agent.
    private dirx = 0;
    private diry = 0;

    // Reusable separation-accumulation scratch.
    private sepSelf = -1;
    private sepSelfSize = 0;
    private sepSelfCarn = false;
    private sepX = 0;
    private sepY = 0;
    private sepAx = 0;
    private sepAy = 0;
    private readonly sepVisit: (id: number, d2: number) => void;

    constructor(
        config: EcosystemConfig,
        castes: readonly Caste[],
        rng: Rng,
        lineages?: readonly number[],
    ) {
        this.config = config;
        this.castes = castes.slice();
        this.lineageOf = lineages ? lineages.slice() : castes.map((_, k) => k);
        const maxLineage = this.lineageOf.reduce((m, l) => Math.max(m, l), -1);
        this.turnover = new Array(maxLineage + 1).fill(0);
        this.rng = rng;
        const cellSize = config.worldSize / config.fieldCells;
        this.light = new ScalarField(
            config.fieldCells,
            config.fieldCells,
            cellSize,
            config.lightInitial,
            config.lightCap,
        );
        this.pop = new Population(config.capacity);

        // Bucket size ≈ the largest sense radius so queries touch few cells.
        let senseMax = 1;
        for (const c of castes) {
            senseMax = Math.max(senseMax, c.visionRadius, c.reach);
        }
        this.grid = new SpatialHash(senseMax);

        // Finer grid for the small separation radius.
        let sepMax = SEP_MIN_RADIUS;
        for (const c of castes) {
            sepMax = Math.max(sepMax, c.size * SEP_RADIUS_PER_SIZE);
        }
        this.sepGrid = new SpatialHash(sepMax);

        this.visit = (id: number, d2: number) => {
            if (id === this.senseSelf) return;
            if (!this.pop.alive[id]) return;
            const oc = this.castes[this.pop.caste[id]];
            if (this.senseMode === SENSE_PREY) {
                if (oc.size >= this.senseSelfSize) return;
            } else {
                if (oc.metabolism !== 'carnivore') return;
                if (oc.size <= this.senseSelfSize) return;
            }
            if (d2 < this.bestD2) {
                this.bestD2 = d2;
                this.bestIdx = id;
            }
        };

        // Accumulate a push away from each close neighbour — EXCEPT across a
        // predator-prey pair. A predator ignores separation from prey it can eat
        // (so it can close in), and prey ignores it from its predator (fleeing
        // handles that). Everything else — same species, or two non-predators —
        // keeps its distance, so nothing overlaps and phases through.
        this.sepVisit = (id: number, d2: number) => {
            if (id === this.sepSelf || d2 <= 1e-6) return;
            if (!this.pop.alive[id]) return;
            const oc = this.castes[this.pop.caste[id]];
            if (this.sepSelfCarn && oc.size < this.sepSelfSize) return; // I eat it
            if (oc.metabolism === 'carnivore' && this.sepSelfSize < oc.size) {
                return; // it eats me
            }
            const inv = 1 / d2; // closer neighbours push harder
            this.sepAx += (this.sepX - this.pop.x[id]) * inv;
            this.sepAy += (this.sepY - this.pop.y[id]) * inv;
        };
    }

    /** Place `count` organisms of a caste in a disc around `(cx, cy)`. */
    seed(
        casteIndex: number,
        count: number,
        cx: number,
        cy: number,
        radius: number,
        energy: number,
    ): void {
        for (let n = 0; n < count; n++) {
            const ang = this.rng.range(0, Math.PI * 2);
            const rad = radius * Math.sqrt(this.rng.next());
            const x = this.clamp(cx + Math.cos(ang) * rad);
            const y = this.clamp(cy + Math.sin(ang) * rad);
            this.pop.spawn(x, y, energy, casteIndex);
        }
    }

    private clamp(v: number): number {
        const max = this.config.worldSize;
        return v < 0 ? 0 : v > max ? max : v;
    }

    /** Rebuild both neighbor grids from current live positions. */
    private rebuildGrid(): void {
        const pop = this.pop;
        this.grid.clear();
        this.sepGrid.clear();
        for (let i = 0; i < pop.count; i++) {
            this.grid.insert(i, pop.x[i], pop.y[i]);
            this.sepGrid.insert(i, pop.x[i], pop.y[i]);
        }
    }

    /**
     * Blend a separation push (away from close neighbours) into the current
     * `dirx`/`diry` steering direction, so organisms spread out instead of
     * overlapping. Re-normalizes the result to a unit direction.
     */
    private applySeparation(i: number, c: Caste): void {
        const radius = Math.max(SEP_MIN_RADIUS, c.size * SEP_RADIUS_PER_SIZE);
        this.sepSelf = i;
        this.sepSelfSize = c.size;
        this.sepSelfCarn = c.metabolism === 'carnivore';
        this.sepX = this.pop.x[i];
        this.sepY = this.pop.y[i];
        this.sepAx = 0;
        this.sepAy = 0;
        this.sepGrid.forEachInRadius(
            this.sepX,
            this.sepY,
            radius,
            this.sepVisit,
        );
        const m = Math.hypot(this.sepAx, this.sepAy);
        if (m < 1e-6) return; // no close neighbours — keep the goal direction
        let dx = this.dirx + (this.sepAx / m) * SEP_WEIGHT;
        let dy = this.diry + (this.sepAy / m) * SEP_WEIGHT;
        const dm = Math.hypot(dx, dy);
        if (dm > 1e-6) {
            dx /= dm;
            dy /= dm;
        }
        this.dirx = dx;
        this.diry = dy;
    }

    /**
     * Find the nearest organism to `i` within `radius` matching `mode` (prey =
     * smaller than self; threat = a larger carnivore). Returns its index or -1.
     */
    private senseNearest(i: number, radius: number, mode: number): number {
        this.senseMode = mode;
        this.senseSelf = i;
        this.senseSelfSize = this.castes[this.pop.caste[i]].size;
        this.bestIdx = -1;
        this.bestD2 = Infinity;
        this.grid.forEachInRadius(
            this.pop.x[i],
            this.pop.y[i],
            radius,
            this.visit,
        );
        return this.bestIdx;
    }

    /** Advance the simulation by one fixed timestep. */
    step(): void {
        const { dt, lightRegen } = this.config;
        const reproScale = this.config.reproCooldownScale ?? 1;
        const pop = this.pop;
        const light = this.light;

        light.regen(dt, lightRegen);
        this.rebuildGrid();

        // Process only organisms alive at the start of the tick; newborns append
        // beyond n0 and wait for the next tick.
        const n0 = pop.count;
        for (let i = 0; i < n0; i++) {
            if (!pop.alive[i]) continue;
            const c = this.castes[pop.caste[i]];

            pop.energy[i] -= c.upkeep * dt;
            pop.atk[i] -= dt;

            const x = pop.x[i];
            const y = pop.y[i];

            if (c.metabolism === 'photo') {
                // Graze light where standing.
                const taken = light.consume(x, y, c.harvestRate * dt);
                pop.energy[i] += taken * c.conversion;

                // Flee the nearest predator, else climb the light gradient.
                const threat = this.senseNearest(
                    i,
                    c.visionRadius,
                    SENSE_THREAT,
                );
                if (threat >= 0) {
                    this.unit(x - pop.x[threat], y - pop.y[threat]);
                } else {
                    this.gradientDir(x, y, c.visionStep);
                }
            } else {
                // Hunt the nearest smaller organism; eat it if within reach.
                const prey = this.senseNearest(i, c.visionRadius, SENSE_PREY);
                if (prey >= 0) {
                    const dx = pop.x[prey] - x;
                    const dy = pop.y[prey] - y;
                    if (
                        dx * dx + dy * dy <= c.reach * c.reach &&
                        pop.atk[i] <= 0
                    ) {
                        pop.energy[i] +=
                            this.castes[pop.caste[prey]].size * c.killEnergy;
                        this.accrue(pop.caste[i], KILL_WEIGHT);
                        this.accrue(pop.caste[prey], DEATH_WEIGHT);
                        this.recordDeath(prey);
                        this.recordHit(pop.x[prey], pop.y[prey]);
                        pop.kill(prey);
                        pop.atk[i] = c.attackCooldown;
                        // Recoil: the predator lurches back from the strike.
                        const kd = Math.hypot(dx, dy) || 1;
                        pop.vx[i] -= (dx / kd) * COMBAT_KNOCKBACK;
                        pop.vy[i] -= (dy / kd) * COMBAT_KNOCKBACK;
                    }
                    this.unit(dx, dy);
                } else {
                    const a = this.rng.range(0, Math.PI * 2);
                    this.dirx = Math.cos(a);
                    this.diry = Math.sin(a);
                }
            }

            this.applySeparation(i, c);
            this.applySteer(i, c);

            // Move and clamp to the world; stop at walls.
            let nx = x + pop.vx[i] * dt;
            let ny = y + pop.vy[i] * dt;
            const max = this.config.worldSize;
            if (nx < 0) {
                nx = 0;
                pop.vx[i] = 0;
            } else if (nx > max) {
                nx = max;
                pop.vx[i] = 0;
            }
            if (ny < 0) {
                ny = 0;
                pop.vy[i] = 0;
            } else if (ny > max) {
                ny = max;
                pop.vy[i] = 0;
            }
            pop.x[i] = nx;
            pop.y[i] = ny;

            // Reproduce.
            pop.repro[i] -= dt;
            if (
                pop.energy[i] >= c.spawnThreshold &&
                pop.repro[i] <= 0 &&
                pop.count < pop.capacity
            ) {
                pop.energy[i] -= c.spawnCost;
                const cooldown = c.spawnCooldown * reproScale;
                pop.repro[i] = cooldown;
                const ox = this.clamp(nx + this.rng.range(-2, 2));
                const oy = this.clamp(ny + this.rng.range(-2, 2));
                pop.spawn(
                    ox,
                    oy,
                    c.spawnCost * c.childEnergyFrac,
                    pop.caste[i],
                    cooldown,
                );
                this.accrue(pop.caste[i], BIRTH_WEIGHT);
            }

            // Age and death.
            pop.age[i] += dt;
            if (pop.age[i] >= c.lifespan || pop.energy[i] <= 0) {
                this.accrue(pop.caste[i], DEATH_WEIGHT);
                this.recordDeath(i);
                pop.kill(i);
            }
        }

        pop.compact();
        this.time += dt;
    }

    /**
     * Normalize a vector to unit length into `dirx`/`diry`, or a random fallback
     * direction if the vector is ~zero.
     */
    private unit(dx: number, dy: number): void {
        const m = Math.hypot(dx, dy);
        if (m > 1e-6) {
            this.dirx = dx / m;
            this.diry = dy / m;
            return;
        }
        const a = this.rng.range(0, Math.PI * 2);
        this.dirx = Math.cos(a);
        this.diry = Math.sin(a);
    }

    /**
     * Set `dirx`/`diry` to the unit light gradient (random if the field is flat).
     */
    private gradientDir(x: number, y: number, s: number): void {
        const gx = this.light.sample(x + s, y) - this.light.sample(x - s, y);
        const gy = this.light.sample(x, y + s) - this.light.sample(x, y - s);
        this.unit(gx, gy);
    }

    /**
     * Steer toward the current `dirx`/`diry` (plus a little wander), easing the
     * velocity rather than snapping it — momentum keeps motion smooth instead of
     * jittery. Speed is clamped to the caste's max.
     */
    private applySteer(i: number, c: Caste): void {
        const pop = this.pop;
        const desiredVx =
            this.dirx * c.moveSpeed +
            this.rng.range(-1, 1) * c.wander * c.moveSpeed;
        const desiredVy =
            this.diry * c.moveSpeed +
            this.rng.range(-1, 1) * c.wander * c.moveSpeed;
        // Blend toward the desired velocity (turn/accelerate gradually).
        let vx = pop.vx[i] + (desiredVx - pop.vx[i]) * STEER_EASING;
        let vy = pop.vy[i] + (desiredVy - pop.vy[i]) * STEER_EASING;
        const sp = Math.hypot(vx, vy);
        if (sp > c.moveSpeed) {
            const k = c.moveSpeed / sp;
            vx *= k;
            vy *= k;
        }
        pop.vx[i] = vx;
        pop.vy[i] = vy;
    }

    /** Number of living organisms. */
    populationCount(): number {
        return this.pop.count;
    }

    /** Number of living organisms of a given caste. */
    countOf(casteIndex: number): number {
        const pop = this.pop;
        let n = 0;
        for (let i = 0; i < pop.count; i++)
            if (pop.caste[i] === casteIndex) n++;
        return n;
    }

    /** Total living biomass (sum of caste size over organisms). */
    biomass(): number {
        const pop = this.pop;
        let b = 0;
        for (let i = 0; i < pop.count; i++) b += this.castes[pop.caste[i]].size;
        return b;
    }

    /** Add turnover Pressure to the lineage that owns `caste`. */
    private accrue(caste: number, weight: number): void {
        this.turnover[this.lineageOf[caste]] += weight;
    }

    /** Record a dying organism's position for the renderer to fade out. */
    private recordDeath(i: number): void {
        if (!this.recordDeaths || this.deathX.length >= 20000) return;
        this.deathX.push(this.pop.x[i]);
        this.deathY.push(this.pop.y[i]);
        this.deathCaste.push(this.pop.caste[i]);
    }

    /** Record a combat kill position for the renderer to flash. */
    private recordHit(x: number, y: number): void {
        if (!this.recordDeaths || this.hitX.length >= 5000) return;
        this.hitX.push(x);
        this.hitY.push(y);
    }

    /** Clear the per-frame death and combat buffers (a renderer drains them). */
    clearDeaths(): void {
        this.deathX.length = 0;
        this.deathY.length = 0;
        this.deathCaste.length = 0;
        this.hitX.length = 0;
        this.hitY.length = 0;
    }

    /**
     * Take and reset the Evolutionary Pressure a lineage has accrued from turnover
     * (births, deaths, kills) since the last drain.
     */
    drainPressure(lineage: number): number {
        const v = this.turnover[lineage] ?? 0;
        this.turnover[lineage] = 0;
        return v;
    }

    /** Living biomass owned by a lineage (summed across its castes). */
    biomassOfLineage(lineage: number): number {
        const pop = this.pop;
        let b = 0;
        for (let i = 0; i < pop.count; i++) {
            const c = pop.caste[i];
            if (this.lineageOf[c] === lineage) b += this.castes[c].size;
        }
        return b;
    }

    /** Living organism count owned by a lineage. */
    countOfLineage(lineage: number): number {
        const pop = this.pop;
        let n = 0;
        for (let i = 0; i < pop.count; i++) {
            if (this.lineageOf[pop.caste[i]] === lineage) n++;
        }
        return n;
    }

    /**
     * Register a new caste at runtime (a split branch) owned by `lineage`.
     * Returns its caste index.
     */
    addCaste(caste: Caste, lineage: number): number {
        const idx = this.castes.length;
        this.castes.push(caste);
        this.lineageOf[idx] = lineage;
        while (this.turnover.length <= lineage) this.turnover.push(0);
        return idx;
    }

    /** Replace a caste's compiled genome in place (retrofits its living organisms). */
    setCasteGenome(casteIndex: number, caste: Caste): void {
        this.castes[casteIndex] = caste;
    }

    /**
     * Reassign a fraction of one caste's living organisms to another caste — how a
     * split realizes its preset proportion. Deterministic via the match RNG.
     *
     * @returns The number of organisms moved.
     */
    reassignFraction(
        fromCaste: number,
        toCaste: number,
        fraction: number,
    ): number {
        const pop = this.pop;
        let moved = 0;
        for (let i = 0; i < pop.count; i++) {
            if (pop.caste[i] === fromCaste && this.rng.next() < fraction) {
                pop.caste[i] = toCaste;
                moved++;
            }
        }
        return moved;
    }
}
