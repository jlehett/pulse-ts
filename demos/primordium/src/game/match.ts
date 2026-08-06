import { Ecosystem } from '../sim/ecosystem';
import { CARDS, compileGenome } from '../sim/genome';
import type { Card } from '../sim/genome';
import type { Rng } from '../sim/rng';
import { DEFAULT_CONFIG, WILDLIFE_CASTE } from '../sim/types';
import type { Caste, EcosystemConfig } from '../sim/types';

/**
 * A competing lineage's setup: a colour, a spawn region, and an ordered plan of
 * cards its AI plays as Evolutionary Pressure allows. All lineages start from the
 * same base genome and diverge only through the cards they play.
 */
export interface LineagePlan {
    name: string;
    color: number;
    /** Cards the AI plays in order, funded by Pressure at evolve turns. */
    plan: Card[];
    spawn: { fx: number; fy: number; count: number; energy: number };
}

/** Live per-lineage state during a match. */
interface Lineage {
    id: number;
    name: string;
    color: number;
    plan: Card[];
    planIndex: number;
    pressure: number;
    /** Cards actually applied to this lineage's caste, in order (its genome). */
    genome: Card[];
    /** The caste index this lineage evolves (its primary/only caste for the MVP). */
    caste: number;
}

/** Tuning for a match's cadence and length. */
export interface MatchOptions {
    /** Seconds of sim between evolve turns. */
    eventIntervalSec?: number;
    /** Total match length in seconds; the buzzer freezes standings. */
    matchLengthSec?: number;
    /** Seed disc radius. */
    seedRadius?: number;
    /**
     * Multiplier from raw turnover (births/deaths/kills) to Evolutionary Pressure.
     * Small, because a healthy population generates a lot of turnover; this paces
     * how fast a lineage can afford cards. Default tuned so plans roll out over
     * several evolve turns.
     */
    pressureRate?: number;
    /**
     * Lineage index controlled by a human. That lineage does not auto-play at
     * evolve turns; instead the match pauses ({@link MatchController.awaitingPlayer})
     * until the player plays cards and calls {@link MatchController.resume}.
     */
    humanLineage?: number;
    /**
     * Maximum Evolutionary Pressure a lineage can *gain* in a single evolve turn.
     * Caps late-game turnover so Pressure stays scarce and each round is a real
     * choice (unspent Pressure still banks).
     */
    maxPressurePerTurn?: number;
    /**
     * How many neutral wildlife critters to scatter across the map. They belong to
     * no faction (excluded from standings) and give predators a food source
     * independent of the player species. 0 = none.
     */
    wildlifeCount?: number;
}

/** What a lineage evolved in a single turn (for the round log). */
export interface TurnPlay {
    name: string;
    color: number;
    cards: Card[];
}

/** One row of the biomass leaderboard. */
export interface Standing {
    name: string;
    color: number;
    biomass: number;
    pressure: number;
    cards: number;
}

/**
 * Runs a punctuated-equilibrium match: the {@link Ecosystem} advances in real
 * time and, every `eventIntervalSec`, an **evolve turn** fires — each lineage
 * collects the Evolutionary Pressure its population generated from turnover and
 * its AI spends it playing the next cards in its plan onto its genome (retrofitting
 * its living organisms). Highest biomass at the buzzer wins.
 *
 * Fully deterministic given `(rosters, rng, config, options)`.
 */
export class MatchController {
    readonly eco: Ecosystem;
    readonly lineages: Lineage[];
    readonly config: EcosystemConfig;
    readonly eventIntervalSec: number;
    readonly matchLengthSec: number;
    readonly pressureRate: number;
    readonly humanLineage: number | null;
    readonly maxPressurePerTurn: number;
    /** Caste index of the neutral wildlife, or null if none. */
    readonly wildlifeCaste: number | null;
    /** Target standing wildlife population the spawner tops up toward. */
    private readonly wildlifeTarget: number;
    private wildlifeTimer = 0;
    /** Number of evolve turns fired so far. */
    eventCount = 0;
    /** True while paused at an evolve turn waiting for the human to play + resume. */
    awaitingPlayer = false;
    /** What each lineage evolved on the most recent turn (for the round log). */
    lastPlays: TurnPlay[] = [];

    private nextEventTime: number;
    /** Genome length per lineage at the start of the current turn (for diffing). */
    private turnStartLen: number[] = [];

    constructor(
        rosters: LineagePlan[],
        rng: Rng,
        config: EcosystemConfig = DEFAULT_CONFIG,
        opts: MatchOptions = {},
    ) {
        this.config = config;
        this.eventIntervalSec = opts.eventIntervalSec ?? 30;
        this.matchLengthSec = opts.matchLengthSec ?? 300;
        this.pressureRate = opts.pressureRate ?? 0.004;
        this.humanLineage = opts.humanLineage ?? null;
        this.maxPressurePerTurn = opts.maxPressurePerTurn ?? 5;
        this.nextEventTime = this.eventIntervalSec;

        // Every lineage starts from the same base genome (one caste each).
        const castes: Caste[] = rosters.map((r) => compileGenome(r.name, []));
        this.eco = new Ecosystem(config, castes, rng);

        this.lineages = rosters.map((r, id) => ({
            id,
            name: r.name,
            color: r.color,
            plan: r.plan,
            planIndex: 0,
            pressure: 0,
            genome: [],
            caste: id,
        }));

        const rad = opts.seedRadius ?? 18;
        rosters.forEach((r, id) => {
            this.eco.seed(
                id,
                r.spawn.count,
                r.spawn.fx * config.worldSize,
                r.spawn.fy * config.worldSize,
                rad,
                r.spawn.energy,
            );
        });

        // Neutral wildlife: its own lineage (not in `lineages`, so out of
        // standings), scattered across the whole map and kept topped up.
        this.wildlifeTarget = opts.wildlifeCount ?? 0;
        if (this.wildlifeTarget > 0) {
            this.wildlifeCaste = this.eco.addCaste(
                WILDLIFE_CASTE,
                rosters.length,
            );
            this.scatterWildlife(this.wildlifeTarget);
        } else {
            this.wildlifeCaste = null;
        }
    }

    /** Spawn `n` wildlife at random spots across the map. */
    private scatterWildlife(n: number): void {
        if (this.wildlifeCaste === null || n <= 0) return;
        const w = this.config.worldSize;
        this.eco.seed(this.wildlifeCaste, n, w / 2, w / 2, w * 0.48, 3);
    }

    /** True once the match clock has reached the buzzer. */
    get finished(): boolean {
        return this.eco.time >= this.matchLengthSec;
    }

    /**
     * Advance one fixed step. Fires an evolve turn when the interval elapses; if a
     * human lineage is set, the match then pauses ({@link awaitingPlayer}) until
     * {@link resume} is called. Paused or finished steps are no-ops.
     */
    step(): void {
        if (this.finished || this.awaitingPlayer) return;
        this.eco.step();
        this.maintainWildlife();
        // Skip an evolve turn that lands exactly on the buzzer — the match is over.
        if (!this.finished && this.eco.time >= this.nextEventTime) {
            this.beginEvolveTurn();
        }
    }

    /** Once a second, top wildlife back up toward its target (a few at a time). */
    private maintainWildlife(): void {
        if (this.wildlifeCaste === null) return;
        this.wildlifeTimer += this.config.dt;
        if (this.wildlifeTimer < 1) return;
        this.wildlifeTimer -= 1;
        const deficit =
            this.wildlifeTarget - this.eco.countOf(this.wildlifeCaste);
        if (deficit > 0) this.scatterWildlife(Math.min(deficit, 25));
    }

    /**
     * Run the whole match to the buzzer. Autonomous matches only — throws if a
     * human lineage is set (it would pause forever).
     */
    runToEnd(): void {
        if (this.humanLineage !== null) {
            throw new Error(
                'runToEnd requires an autonomous match (no human).',
            );
        }
        while (!this.finished) this.step();
    }

    /** The human lineage's live state, or null for an autonomous match. */
    get human(): Lineage | null {
        return this.humanLineage === null
            ? null
            : this.lineages[this.humanLineage];
    }

    /**
     * Play a card as the human lineage during an evolve turn (while paused).
     * Deducts its Pressure and *queues* the card onto the genome, but does **not**
     * apply it to the sim yet — the effect lands on {@link resume}, so you don't
     * see your own evolutions (or the AIs') until the turn commits.
     *
     * @returns True if played; false if not the human's turn or unaffordable.
     */
    playHumanCard(card: Card): boolean {
        if (this.human === null || !this.awaitingPlayer) return false;
        const lin = this.human;
        if (card.cost > lin.pressure) return false;
        if (lin.genome.includes(card)) return false; // one of each card per species
        lin.pressure -= card.cost;
        lin.genome.push(card);
        return true;
    }

    /**
     * Commit the evolve turn: your queued cards and the AIs' plays all apply now,
     * simultaneously, then the sim resumes. Nothing visibly evolved until this
     * point — the whole turn lands at once.
     */
    resume(): void {
        if (!this.awaitingPlayer) return;
        const you = this.human;
        if (you) {
            this.eco.setCasteGenome(
                you.caste,
                compileGenome(you.name, you.genome),
            );
        }
        for (const lin of this.lineages) {
            if (lin.id !== this.humanLineage) this.aiPlay(lin);
        }
        this.recordPlays();
        this.awaitingPlayer = false;
        this.nextEventTime += this.eventIntervalSec;
    }

    /**
     * A mutation event: every lineage collects Pressure (capped per turn). In an
     * autonomous match the AIs play immediately; with a human lineage the match
     * pauses instead, and the AIs defer their plays to {@link resume} so their
     * evolutions stay hidden until you've committed yours (blind, simultaneous).
     */
    private beginEvolveTurn(): void {
        this.eventCount++;
        this.turnStartLen = this.lineages.map((l) => l.genome.length);
        for (const lin of this.lineages) {
            const gain = this.eco.drainPressure(lin.id) * this.pressureRate;
            lin.pressure += Math.min(gain, this.maxPressurePerTurn);
        }
        if (this.humanLineage !== null) {
            this.awaitingPlayer = true; // AIs play on resume, not now
        } else {
            for (const lin of this.lineages) this.aiPlay(lin);
            this.recordPlays();
            this.nextEventTime += this.eventIntervalSec;
        }
    }

    /** Spend Pressure on the next affordable, not-yet-owned cards in the plan. */
    private aiPlay(lin: Lineage): void {
        while (lin.planIndex < lin.plan.length) {
            const card = lin.plan[lin.planIndex];
            if (lin.genome.includes(card)) {
                lin.planIndex++; // already have it — skip (one of each)
                continue;
            }
            if (card.cost > lin.pressure) break; // can't afford yet — bank
            lin.pressure -= card.cost;
            lin.genome.push(card);
            this.eco.setCasteGenome(
                lin.caste,
                compileGenome(lin.name, lin.genome),
            );
            lin.planIndex++;
        }
    }

    /** Snapshot what each lineage evolved this turn into {@link lastPlays}. */
    private recordPlays(): void {
        this.lastPlays = this.lineages.map((l, i) => ({
            name: l.name,
            color: l.color,
            cards: l.genome.slice(this.turnStartLen[i] ?? l.genome.length),
        }));
    }

    /** Current biomass leaderboard, highest first. */
    standings(): Standing[] {
        return this.lineages
            .map((l) => ({
                name: l.name,
                color: l.color,
                biomass: this.eco.biomassOfLineage(l.id),
                pressure: l.pressure,
                cards: l.genome.length,
            }))
            .sort((a, b) => b.biomass - a.biomass);
    }
}

/** The MVP roster — four lineages that diverge from the same base via their plans. */
export const DEFAULT_ROSTER: LineagePlan[] = [
    {
        name: 'Bloom',
        color: 0x5ce07a,
        plan: [], // control: a plain self-multiplier that never evolves
        spawn: { fx: 0.25, fy: 0.25, count: 20, energy: 3 },
    },
    {
        name: 'Swarm',
        color: 0xffd24a,
        plan: [CARDS.prolific, CARDS.fast, CARDS.efficient],
        spawn: { fx: 0.75, fy: 0.25, count: 20, energy: 3 },
    },
    {
        name: 'Titan',
        color: 0x5aa0ff,
        plan: [CARDS.biggerBody, CARDS.longLived, CARDS.keenSenses],
        spawn: { fx: 0.25, fy: 0.75, count: 20, energy: 3 },
    },
    {
        name: 'Fang',
        color: 0xff5a52,
        plan: [CARDS.predation, CARDS.fast, CARDS.keenSenses],
        spawn: { fx: 0.75, fy: 0.75, count: 12, energy: 5 },
    },
];
