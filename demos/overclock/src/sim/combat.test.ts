import {
    aliveUnits,
    createCombat,
    effectiveAtkSpeed,
    stepCombat,
} from './combat';
import type { CombatEvent, CombatState, PlacedUnit } from './types';

/** Fixed-value RNG keeps tests deterministic (never crits at 0.99). */
const noLuck = () => 0.99;

const place = (
    uid: string,
    defId: string,
    row: number,
    col: number,
    star = 1,
): PlacedUnit => ({ uid, defId, star, row, col });

function runToEnd(state: CombatState, maxSeconds = 120): CombatEvent[] {
    const events: CombatEvent[] = [];
    const dt = 1 / 30;
    let t = 0;
    while (state.phase === 'running' && t < maxSeconds) {
        stepCombat(state, dt);
        events.push(...state.events);
        state.events.length = 0;
        t += dt;
    }
    return events;
}

describe('createCombat', () => {
    it('builds units with star-scaled stats', () => {
        const state = createCombat({
            player: [place('p0', 'piton', 4, 3, 2)],
            enemy: [place('e0', 'piton', 3, 3, 1)],
            augments: [],
            enemyStatScale: 1,
            rng: noLuck,
        });
        const p = state.byUid.get('p0')!;
        const e = state.byUid.get('e0')!;
        expect(p.maxHp).toBe(Math.round(620 * 1.8));
        expect(e.maxHp).toBe(620);
    });

    it('applies enemy stat scaling', () => {
        const state = createCombat({
            player: [place('p0', 'piton', 4, 3)],
            enemy: [place('e0', 'piton', 3, 3)],
            augments: [],
            enemyStatScale: 1.5,
            rng: noLuck,
        });
        expect(state.byUid.get('e0')!.maxHp).toBe(Math.round(620 * 1.5));
    });

    it('throws on unknown unit ids', () => {
        expect(() =>
            createCombat({
                player: [place('p0', 'not-a-unit', 4, 3)],
                enemy: [],
                augments: [],
                enemyStatScale: 1,
                rng: noLuck,
            }),
        ).toThrow('Unknown unit def');
    });
});

describe('stepCombat', () => {
    it('resolves a lopsided 1v1 in favor of the stronger unit', () => {
        const state = createCombat({
            player: [place('p0', 'caldera', 4, 3, 2)],
            enemy: [place('e0', 'widget', 3, 3, 1)],
            augments: [],
            enemyStatScale: 1,
            rng: noLuck,
        });
        const events = runToEnd(state);
        expect(state.phase).toBe('playerWin');
        expect(events.some((e) => e.type === 'death' && e.unit === 'e0')).toBe(
            true,
        );
        expect(events.some((e) => e.type === 'attack')).toBe(true);
        expect(events.some((e) => e.type === 'hit')).toBe(true);
    });

    it('moves melee units toward distant targets', () => {
        const state = createCombat({
            player: [place('p0', 'piton', 7, 0)],
            enemy: [place('e0', 'piton', 0, 6)],
            augments: [],
            enemyStatScale: 1,
            rng: noLuck,
        });
        for (let i = 0; i < 90; i++) stepCombat(state, 1 / 30);
        const moved = state.events.length; // events drained lazily here
        expect(moved).toBeGreaterThan(0);
        const p = state.byUid.get('p0')!;
        expect(p.row).toBeLessThan(7); // walked up the board
    });

    it('is deterministic for a fixed RNG sequence', () => {
        const build = () =>
            createCombat({
                player: [
                    place('p0', 'pips', 6, 2),
                    place('p1', 'frostbit', 4, 3),
                ],
                enemy: [
                    place('e0', 'widget', 3, 3),
                    place('e1', 'piton', 3, 4),
                ],
                augments: [],
                enemyStatScale: 1,
                rng: noLuck,
            });
        const a = build();
        const b = build();
        const eventsA = runToEnd(a);
        const eventsB = runToEnd(b);
        expect(a.phase).toBe(b.phase);
        expect(eventsA).toEqual(eventsB);
    });

    it('ends with enemyWin when the player team dies', () => {
        const state = createCombat({
            player: [place('p0', 'widget', 4, 3)],
            enemy: [place('e0', 'caldera', 3, 3, 3)],
            augments: [],
            enemyStatScale: 1,
            rng: noLuck,
        });
        runToEnd(state);
        expect(state.phase).toBe('enemyWin');
        expect(aliveUnits(state, 'player')).toHaveLength(0);
    });

    it('casts abilities when mana fills and emits cast events', () => {
        // Sparkplug starts at 0 mana but manaMax 50 → fills after 5 attacks.
        const state = createCombat({
            player: [place('p0', 'sparkplug', 4, 3, 3)],
            enemy: [place('e0', 'bulkhead', 3, 3, 2)],
            augments: [],
            enemyStatScale: 1,
            rng: noLuck,
        });
        const events = runToEnd(state);
        expect(events.some((e) => e.type === 'cast' && e.unit === 'p0')).toBe(
            true,
        );
    });

    it('vanguard pairs gain starting shields', () => {
        const state = createCombat({
            player: [place('p0', 'piton', 4, 2), place('p1', 'bulkhead', 4, 4)],
            enemy: [place('e0', 'widget', 0, 3)],
            augments: [],
            enemyStatScale: 1,
            rng: noLuck,
        });
        const p0 = state.byUid.get('p0')!;
        expect(p0.shield).toBe(Math.round(p0.maxHp * 0.25));
    });

    it('chill reduces effective attack speed', () => {
        const state = createCombat({
            player: [place('p0', 'frostbit', 4, 3)],
            enemy: [place('e0', 'bulkhead', 3, 3, 2)],
            augments: [],
            enemyStatScale: 1,
            rng: noLuck,
        });
        const target = state.byUid.get('e0')!;
        const before = effectiveAtkSpeed(target);
        // Frostbit is cryostat but solo (no trait tier); force its ability
        // by filling mana — Cold Cut applies a 30% chill.
        state.byUid.get('p0')!.mana = 70;
        for (let i = 0; i < 30; i++) stepCombat(state, 1 / 30);
        expect(target.chillRemaining).toBeGreaterThan(0);
        expect(effectiveAtkSpeed(target)).toBeLessThan(before);
    });

    it('surge casts grant allies mana', () => {
        const state = createCombat({
            player: [
                place('p0', 'sparkplug', 4, 3),
                place('p1', 'piton', 4, 4),
            ],
            enemy: [place('e0', 'bulkhead', 3, 3, 2)],
            augments: [],
            enemyStatScale: 1,
            rng: noLuck,
        });
        const ally = state.byUid.get('p1')!;
        // Park the ally out of combat relevance and snapshot mana, then
        // force sparkplug to cast.
        const manaBefore = ally.mana;
        state.byUid.get('p0')!.mana = 50;
        stepCombat(state, 1 / 30);
        expect(ally.mana).toBeGreaterThanOrEqual(manaBefore + 6);
    });

    it('pierce hits every enemy along the line', () => {
        const state = createCombat({
            player: [place('p0', 'parallax', 7, 3)],
            enemy: [place('e0', 'piton', 5, 3), place('e1', 'piton', 3, 3)],
            augments: [],
            enemyStatScale: 1,
            rng: noLuck,
        });
        state.byUid.get('p0')!.mana = 90; // force immediate cast
        stepCombat(state, 1 / 30);
        const hits = state.events.filter((e) => e.type === 'hit');
        const hitTargets = new Set(
            hits.map((e) => (e.type === 'hit' ? e.target : '')),
        );
        expect(hitTargets.has('e0')).toBe(true);
        expect(hitTargets.has('e1')).toBe(true);
    });

    it('scrapline kills can drop bonus gold', () => {
        const state = createCombat({
            player: [
                place('p0', 'widget', 4, 3),
                place('p1', 'ricochet', 4, 4),
            ],
            enemy: [place('e0', 'pips', 3, 3)],
            augments: [],
            enemyStatScale: 1,
            rng: () => 0.0, // always procs the gold drop
        });
        const events = runToEnd(state);
        expect(state.phase).toBe('playerWin');
        expect(events.some((e) => e.type === 'goldDrop')).toBe(true);
        expect(state.bonusGold).toBeGreaterThan(0);
    });
});
