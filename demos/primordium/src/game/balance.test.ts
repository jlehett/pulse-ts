import { DEFAULT_ROSTER, MatchController } from './match';
import { createRng } from '../sim/rng';
import { DEFAULT_CONFIG } from '../sim/types';
import type { EcosystemConfig } from '../sim/types';

/**
 * Regression guard for the *regime* the ecosystem settles into, not for exact
 * numbers. The demo previously collapsed into a "bacterial mat": thousands of
 * specks packed at their separation radius, the light field stripped to ~1% of
 * cap within 40 seconds, and one lineage taking essentially all the biomass
 * while others went extinct. Each assertion below pins one property of the
 * macro-ecosystem regime that replaced it, so a future tuning change that
 * silently reverts one is caught.
 */
const SCENE_CONFIG: EcosystemConfig = {
    ...DEFAULT_CONFIG,
    worldSize: 340,
    fieldCells: 104,
    lightRegen: 0.1,
    capacity: 12000,
    reproCooldownScale: 2,
};

const MATCH_OPTS = {
    eventIntervalSec: 30,
    matchLengthSec: 180,
    pressureRate: 0.15,
    maxPressurePerTurn: 5,
    wildlifeCount: 140,
};

/** Fraction of coarse map bins holding at least one organism. */
function occupancy(match: MatchController): number {
    const bins = 48;
    const cell = SCENE_CONFIG.worldSize / bins;
    const seen = new Uint8Array(bins * bins);
    const pop = match.eco.pop;
    for (let i = 0; i < pop.count; i++) {
        const gx = Math.min(bins - 1, Math.floor(pop.x[i] / cell));
        const gy = Math.min(bins - 1, Math.floor(pop.y[i] / cell));
        seen[gy * bins + gx] = 1;
    }
    let n = 0;
    for (let k = 0; k < seen.length; k++) n += seen[k];
    return n / seen.length;
}

function runMatch() {
    const match = new MatchController(
        DEFAULT_ROSTER,
        createRng(20260804),
        SCENE_CONFIG,
        MATCH_OPTS,
    );
    match.eco.recordDeaths = true;
    let kills = 0;
    while (!match.finished) {
        match.step();
        kills += match.eco.hitX.length;
        match.eco.clearDeaths();
    }
    return { match, kills };
}

// Run once at module load: the assertions below are all cheap reads of the
// finished match, so they share a single simulation rather than each paying for
// their own (and module-level work is not bound by the per-test timeout).
const { match, kills } = runMatch();

describe('match balance regime', () => {
    const eco = match.eco;
    const factionPop = DEFAULT_ROSTER.reduce(
        (n, _, l) => n + eco.countOfLineage(l),
        0,
    );
    const meanLight =
        eco.light.total() / eco.light.values.length / SCENE_CONFIG.lightCap;

    it('settles at a macro population, not a mat of specks', () => {
        // Order of magnitude, not exact: the failed regime ran to 3000-4500.
        expect(factionPop).toBeGreaterThan(200);
        expect(factionPop).toBeLessThan(2000);
    });

    it('leaves the light field visibly grazed but not stripped bare', () => {
        // The mat regime drove this to ~0.01; an unused world sits near 1.
        expect(meanLight).toBeGreaterThan(0.25);
        expect(meanLight).toBeLessThan(0.85);
    });

    it('keeps organisms clumped rather than blanketing the map', () => {
        expect(occupancy(match)).toBeLessThan(0.35);
    });

    it('keeps every lineage alive and in contention', () => {
        const standings = match.standings();
        for (const s of standings) expect(s.biomass).toBeGreaterThan(0);
        // No lineage runs away with essentially the whole map, as Titan did
        // (5267 vs a runner-up of 23) before this pass.
        const [top] = standings;
        const last = standings[standings.length - 1];
        expect(top.biomass / last.biomass).toBeLessThan(12);
    });

    it('produces sustained combat rather than a single wipeout', () => {
        expect(kills).toBeGreaterThan(50);
    });

    it('pays out enough Pressure that lineages actually evolve', () => {
        // With too low a pressure rate every lineage plays out its base genome
        // and the card game never happens.
        const evolved = match.lineages.filter((l) => l.genome.length > 0);
        expect(evolved.length).toBeGreaterThanOrEqual(3);
    });

    it('drives factions out of their home quadrants to interact', () => {
        const mid = SCENE_CONFIG.worldSize / 2;
        const pop = eco.pop;
        let away = 0;
        let total = 0;
        DEFAULT_ROSTER.forEach((r, lineage) => {
            const hx = r.spawn.fx < 0.5 ? 0 : 1;
            const hy = r.spawn.fy < 0.5 ? 0 : 1;
            for (let i = 0; i < pop.count; i++) {
                if (eco.lineageOf[pop.caste[i]] !== lineage) continue;
                total++;
                const qx = pop.x[i] < mid ? 0 : 1;
                const qy = pop.y[i] < mid ? 0 : 1;
                if (qx !== hx || qy !== hy) away++;
            }
        });
        expect(away / total).toBeGreaterThan(0.15);
    });
});
