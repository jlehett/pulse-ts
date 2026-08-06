import { DEFAULT_ROSTER, MatchController } from './match';
import { CARDS } from '../sim/genome';
import { createRng } from '../sim/rng';
import { DEFAULT_CONFIG, PHOTO_CASTE } from '../sim/types';
import type { EcosystemConfig } from '../sim/types';

// A smaller, faster world so the match tests run quickly.
const TEST_CONFIG: EcosystemConfig = {
    ...DEFAULT_CONFIG,
    worldSize: 120,
    fieldCells: 48,
    capacity: 8000,
};

// High pressure rate so evolution reliably happens within the short test match.
const OPTS = {
    eventIntervalSec: 30,
    matchLengthSec: 90,
    pressureRate: 0.05,
} as const;

function runMatch(seed: number) {
    const m = new MatchController(
        DEFAULT_ROSTER,
        createRng(seed),
        TEST_CONFIG,
        OPTS,
    );
    m.runToEnd();
    return m;
}

describe('MatchController', () => {
    it('runs to the buzzer and fires evolve turns on the interval', () => {
        const m = runMatch(1);
        expect(m.finished).toBe(true);
        expect(m.eco.time).toBeGreaterThanOrEqual(OPTS.matchLengthSec);
        // Evolve turns fire at t=30 and t=60; the t=90 slot is the buzzer itself,
        // so it's skipped (nothing to evolve into after the match ends).
        expect(m.eventCount).toBe(2);
    });

    it('is deterministic: same seed => identical standings', () => {
        const a = runMatch(2026).standings();
        const b = runMatch(2026).standings();
        expect(a).toEqual(b);
    });

    it('lineages evolve by spending Pressure on their plans', () => {
        const m = runMatch(7);
        const byName = Object.fromEntries(m.lineages.map((l) => [l.name, l]));
        // Every roster lineage has a plan, and each played at least one card.
        for (const lin of m.lineages) {
            expect(lin.plan.length).toBeGreaterThan(0);
        }
        expect(byName.Swarm.genome.length).toBeGreaterThan(0);
        expect(byName.Fang.genome.length).toBeGreaterThan(0);
    });

    it('a lineage with an empty plan never evolves', () => {
        const roster = DEFAULT_ROSTER.map((r, i) =>
            i === 0 ? { ...r, plan: [] } : r,
        );
        const m = new MatchController(roster, createRng(7), TEST_CONFIG, OPTS);
        m.runToEnd();
        expect(m.lineages[0].genome.length).toBe(0);
    });

    it('Fang becomes a carnivore once it can afford Predation', () => {
        const m = runMatch(7);
        const fang = m.lineages.find((l) => l.name === 'Fang')!;
        expect(m.eco.castes[fang.caste].metabolism).toBe('carnivore');
    });

    it('with a human lineage: pauses at evolve turns, plays, and resumes', () => {
        const m = new MatchController(
            DEFAULT_ROSTER,
            createRng(1),
            TEST_CONFIG,
            {
                ...OPTS,
                humanLineage: 0,
            },
        );
        // Advance to the first evolve turn; the match pauses for the player.
        while (!m.awaitingPlayer && !m.finished) m.step();
        expect(m.awaitingPlayer).toBe(true);
        expect(m.eco.time).toBeGreaterThan(0);

        const human = m.human!;
        human.pressure = 10; // ensure the card is affordable

        // AIs must not have evolved yet — you play blind to their choices.
        const aiCardsAtPause = m.lineages
            .filter((l) => l.id !== 0)
            .map((l) => l.genome.length);

        const ok = m.playHumanCard(CARDS.fast);
        expect(ok).toBe(true);
        expect(human.genome).toContain(CARDS.fast);
        // Can't play the same card twice — one of each per species.
        expect(m.playHumanCard(CARDS.fast)).toBe(false);
        expect(human.genome.filter((c) => c === CARDS.fast).length).toBe(1);
        // Your pick is queued but NOT yet applied to the sim — no visible change
        // until you resume.
        expect(m.eco.castes[human.caste].moveSpeed).toBe(PHOTO_CASTE.moveSpeed);
        // And your action did not evolve the AIs mid-turn either.
        expect(
            m.lineages.filter((l) => l.id !== 0).map((l) => l.genome.length),
        ).toEqual(aiCardsAtPause);

        // On resume everything lands at once: your caste retrofits...
        m.resume();
        expect(m.awaitingPlayer).toBe(false);
        expect(m.eco.castes[human.caste].moveSpeed).toBeGreaterThan(
            PHOTO_CASTE.moveSpeed,
        );
        const aiCardsAfter = m.lineages
            .filter((l) => l.id !== 0)
            .reduce((s, l) => s + l.genome.length, 0);
        expect(aiCardsAfter).toBeGreaterThanOrEqual(
            aiCardsAtPause.reduce((s, n) => s + n, 0),
        );
        // The round log records what you evolved this turn.
        const yourPlays = m.lastPlays.find((p) => p.name === 'Bloom')!;
        expect(yourPlays.cards).toContain(CARDS.fast);

        const t0 = m.eco.time;
        m.step();
        expect(m.eco.time).toBeGreaterThan(t0);
    });

    it('caps Pressure gained per evolve turn', () => {
        const cap = 4;
        const m = new MatchController(
            DEFAULT_ROSTER,
            createRng(3),
            TEST_CONFIG,
            {
                ...OPTS,
                maxPressurePerTurn: cap,
            },
        );
        while (m.eventCount < 1 && !m.finished) m.step();
        // Bloom has an empty plan (spends nothing), so its Pressure is exactly the
        // capped gain from one turn.
        const bloom = m.lineages.find((l) => l.name === 'Bloom')!;
        expect(bloom.pressure).toBeLessThanOrEqual(cap + 1e-9);
    });

    it('runToEnd rejects a human match', () => {
        const m = new MatchController(
            DEFAULT_ROSTER,
            createRng(1),
            TEST_CONFIG,
            {
                ...OPTS,
                humanLineage: 0,
            },
        );
        expect(() => m.runToEnd()).toThrow();
    });

    it('standings are sorted by biomass and cover every lineage', () => {
        const s = runMatch(3).standings();
        expect(s.length).toBe(DEFAULT_ROSTER.length);
        for (let i = 1; i < s.length; i++) {
            expect(s[i - 1].biomass).toBeGreaterThanOrEqual(s[i].biomass);
        }
    });
});
