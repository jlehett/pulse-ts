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

/** Steps the sim and returns the events drained along the way. */
function runFor(state: CombatState, seconds: number): CombatEvent[] {
    const events: CombatEvent[] = [];
    const steps = Math.round(seconds * 30);
    for (let i = 0; i < steps; i++) {
        stepCombat(state, 1 / 30);
        events.push(...state.events);
        state.events.length = 0;
    }
    return events;
}

describe('createCombat', () => {
    it('builds units with star-scaled stats', () => {
        const state = createCombat({
            player: [place('p0', 'pellet', 4, 3, 2)],
            enemy: [place('e0', 'pellet', 3, 3, 1)],
            augments: [],
            enemyStatScale: 1,
            rng: noLuck,
        });
        const p = state.byUid.get('p0')!;
        const e = state.byUid.get('e0')!;
        expect(p.maxHp).toBe(Math.round(460 * 1.8));
        expect(e.maxHp).toBe(460);
    });

    it('applies enemy stat scaling', () => {
        const state = createCombat({
            player: [place('p0', 'pellet', 4, 3)],
            enemy: [place('e0', 'pellet', 3, 3)],
            augments: [],
            enemyStatScale: 1.5,
            rng: noLuck,
        });
        expect(state.byUid.get('e0')!.maxHp).toBe(Math.round(460 * 1.5));
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

    it('grants Aegisline pairs their flat starting barrier', () => {
        const state = createCombat({
            player: [place('p0', 'chock', 4, 2), place('p1', 'tripod', 4, 4)],
            enemy: [place('e0', 'husk', 0, 3)],
            augments: [],
            enemyStatScale: 1,
            rng: noLuck,
        });
        expect(state.byUid.get('p0')!.shield).toBe(200);
        expect(state.byUid.get('p1')!.shield).toBe(200);
        expect(state.byUid.get('e0')!.shield).toBe(0);
        // The render layer needs shield events to flash the barriers in.
        const shieldEvents = state.events.filter((e) => e.type === 'shield');
        expect(shieldEvents.map((e) => e.unit).sort()).toEqual(['p0', 'p1']);
    });
});

describe('stepCombat', () => {
    it('resolves a lopsided 1v1 in favor of the stronger unit', () => {
        const state = createCombat({
            player: [place('p0', 'nocturne', 4, 3, 2)],
            enemy: [place('e0', 'pellet', 3, 3, 1)],
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
            player: [place('p0', 'pellet', 7, 0)],
            enemy: [place('e0', 'pellet', 0, 6)],
            augments: [],
            enemyStatScale: 1,
            rng: noLuck,
        });
        const events = runFor(state, 3);
        expect(events.some((e) => e.type === 'move')).toBe(true);
        const p = state.byUid.get('p0')!;
        expect(p.row).toBeLessThan(7); // walked up the board
    });

    it('is deterministic for a fixed RNG sequence', () => {
        const build = () =>
            createCombat({
                player: [
                    place('p0', 'jolt', 6, 2),
                    place('p1', 'static', 4, 3),
                ],
                enemy: [
                    place('e0', 'pellet', 3, 3),
                    place('e1', 'chock', 3, 4),
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
            player: [place('p0', 'pellet', 4, 3)],
            enemy: [place('e0', 'nocturne', 3, 3, 3)],
            augments: [],
            enemyStatScale: 1,
            rng: noLuck,
        });
        runToEnd(state);
        expect(state.phase).toBe('enemyWin');
        expect(aliveUnits(state, 'player')).toHaveLength(0);
    });

    it('casts abilities when mana fills and emits cast events', () => {
        const state = createCombat({
            player: [place('p0', 'wake', 4, 3, 3)],
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

    it('concussive shells slow the target attack speed', () => {
        const state = createCombat({
            player: [place('p0', 'mortar', 7, 3)],
            enemy: [place('e0', 'husk', 4, 3)],
            augments: [],
            enemyStatScale: 1,
            rng: noLuck,
        });
        const target = state.byUid.get('e0')!;
        const before = effectiveAtkSpeed(target);
        state.byUid.get('p0')!.mana = 75; // force Shellshock
        runFor(state, 1);
        expect(target.slowRemaining).toBeGreaterThan(0);
        expect(effectiveAtkSpeed(target)).toBeLessThan(before);
    });

    it('snipe pierces every enemy along the line', () => {
        const state = createCombat({
            player: [place('p0', 'vantage', 7, 3)],
            enemy: [place('e0', 'chock', 5, 3), place('e1', 'chock', 3, 3)],
            augments: [],
            enemyStatScale: 1,
            rng: noLuck,
        });
        state.byUid.get('p0')!.mana = 90; // force immediate cast
        const events = runFor(state, 1);
        const hitTargets = new Set(
            events.filter((e) => e.type === 'hit').map((e) => e.target),
        );
        expect(hitTargets.has('e0')).toBe(true);
        expect(hitTargets.has('e1')).toBe(true);
    });

    it('stunned units cannot attack', () => {
        const state = createCombat({
            player: [place('p0', 'pellet', 4, 3)],
            enemy: [place('e0', 'husk', 3, 3)],
            augments: [],
            enemyStatScale: 1,
            rng: noLuck,
        });
        state.byUid.get('p0')!.stunRemaining = 10;
        const events = runFor(state, 2);
        expect(events.some((e) => e.type === 'attack' && e.from === 'p0')).toBe(
            false,
        );
        expect(events.some((e) => e.type === 'attack' && e.from === 'e0')).toBe(
            true,
        );
    });
});

describe('trait mechanics in combat', () => {
    it('Juggernaut pairs regenerate max-HP per second', () => {
        const state = createCombat({
            player: [place('p0', 'lug', 7, 2), place('p1', 'bulkhead', 7, 4)],
            enemy: [place('e0', 'husk', 0, 6)],
            augments: [],
            enemyStatScale: 1,
            rng: noLuck,
        });
        const lug = state.byUid.get('p0')!;
        lug.hp = 100;
        runFor(state, 0.5);
        expect(lug.hp).toBeGreaterThan(100);
    });

    it('Vulture pairs heal for a share of damage dealt', () => {
        const state = createCombat({
            player: [place('p0', 'lug', 4, 3), place('p1', 'wake', 4, 2)],
            enemy: [place('e0', 'husk', 3, 3)],
            augments: [],
            enemyStatScale: 1,
            rng: noLuck,
        });
        const lug = state.byUid.get('p0')!;
        state.byUid.get('e0')!.atk = 0; // isolate lifesteal from chip damage
        lug.hp = 200;
        runFor(state, 3);
        expect(lug.hp).toBeGreaterThan(200);
    });

    it('Breaker attacks shred target armor', () => {
        const state = createCombat({
            player: [place('p0', 'jolt', 4, 3), place('p1', 'sledge', 4, 4)],
            enemy: [place('e0', 'chock', 3, 3)],
            augments: [],
            enemyStatScale: 1,
            rng: noLuck,
        });
        const target = state.byUid.get('e0')!;
        const armorBefore = target.armor;
        runFor(state, 3);
        expect(target.armor).toBeLessThan(armorBefore);
    });

    it('Surgecore trios ramp damage on an interval', () => {
        const state = createCombat({
            player: [
                place('p0', 'jolt', 7, 0),
                place('p1', 'brownout', 7, 2),
                place('p2', 'dynamo', 7, 4),
            ],
            enemy: [place('e0', 'husk', 0, 6)],
            augments: [],
            enemyStatScale: 1,
            rng: noLuck,
        });
        const jolt = state.byUid.get('p0')!;
        runFor(state, 4.5);
        expect(jolt.rampBonus).toBeCloseTo(0.08);
    });

    it('Redline pairs gain permanent attack speed', () => {
        const state = createCombat({
            player: [place('p0', 'pellet', 4, 3), place('p1', 'ramrod', 4, 4)],
            enemy: [place('e0', 'husk', 0, 3)],
            augments: [],
            enemyStatScale: 1,
            rng: noLuck,
        });
        const p = state.byUid.get('p0')!;
        expect(p.mods.atkSpeedFlat).toBeCloseTo(0.25);
        expect(effectiveAtkSpeed(p)).toBeCloseTo(p.atkSpeed * 1.25);
    });

    it('Momentum Flywheel spins up continuously in combat', () => {
        const state = createCombat({
            player: [
                {
                    ...place('p0', 'pellet', 4, 3),
                    items: ['momentumFlywheel'],
                },
            ],
            enemy: [place('e0', 'husk', 3, 3)],
            augments: [],
            enemyStatScale: 1,
            rng: noLuck,
        });
        const p = state.byUid.get('p0')!;
        const before = effectiveAtkSpeed(p);
        runFor(state, 2);
        expect(p.itemFx.flywheelSpin).toBeCloseTo(0.04);
        expect(effectiveAtkSpeed(p)).toBeGreaterThan(before);
    });

    it('Bladeform stacks attack speed per kill', () => {
        const state = createCombat({
            player: [place('p0', 'kensei', 7, 3)],
            enemy: [place('e0', 'pellet', 0, 2), place('e1', 'pellet', 0, 4)],
            augments: [],
            enemyStatScale: 1,
            rng: noLuck,
        });
        runToEnd(state);
        expect(state.phase).toBe('playerWin');
        expect(state.byUid.get('p0')!.atkSpeedKillStacks).toBeCloseTo(0.4);
    });
});
