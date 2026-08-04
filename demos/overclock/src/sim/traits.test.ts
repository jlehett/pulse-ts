import type { AugmentDef } from '../config/types';
import { UNIT_BY_ID } from '../config/units';
import { computeTeamMods, countTraits } from './traits';

const def = (id: string) => {
    const d = UNIT_BY_ID.get(id);
    if (!d) throw new Error(`missing unit ${id}`);
    return d;
};

describe('countTraits', () => {
    it('counts unique units per trait on both axes', () => {
        // chock + tripod: both Aegisline, different roles.
        const rows = countTraits([def('chock'), def('tripod')]);
        const aegis = rows.find((r) => r.id === 'aegisline');
        const bulwark = rows.find((r) => r.id === 'bulwark');
        expect(aegis?.count).toBe(2);
        expect(aegis?.tier).toBe(0);
        expect(bulwark?.count).toBe(1);
        expect(bulwark?.tier).toBe(-1);
    });

    it('ignores duplicate copies of the same unit', () => {
        const rows = countTraits([def('chock'), def('chock')]);
        const aegis = rows.find((r) => r.id === 'aegisline');
        expect(aegis?.count).toBe(1);
        expect(aegis?.tier).toBe(-1);
    });

    it('counts Prime traits at one unit', () => {
        const rows = countTraits([def('kensei')]);
        const blade = rows.find((r) => r.id === 'bladeform');
        expect(blade?.count).toBe(1);
        expect(blade?.tier).toBe(0);
    });

    it('sorts active traits first', () => {
        const rows = countTraits([def('chock'), def('tripod'), def('pellet')]);
        expect(rows[0].tier).toBeGreaterThanOrEqual(0);
        const actives = rows.map((r) => r.tier >= 0);
        const firstInactive = actives.indexOf(false);
        if (firstInactive !== -1) {
            expect(actives.lastIndexOf(true)).toBeLessThan(firstInactive);
        }
    });
});

describe('computeTeamMods', () => {
    it('applies manufacturer tiers only to matching units', () => {
        // Two Vulture units activate lifesteal tier 1 (12%).
        const defs = [def('lug'), def('wake'), def('chock')];
        const { modsFor } = computeTeamMods(defs, []);
        expect(modsFor(def('lug')).lifestealPct).toBeCloseTo(0.12);
        expect(modsFor(def('chock')).lifestealPct).toBe(0);
    });

    it('applies role tiers only to units with the role', () => {
        // Two Juggernauts activate regen tier 1 (1.5%/s).
        const defs = [def('lug'), def('bulkhead'), def('chock')];
        const { modsFor } = computeTeamMods(defs, []);
        expect(modsFor(def('lug')).regenPctPerSec).toBeCloseTo(0.015);
        expect(modsFor(def('chock')).regenPctPerSec).toBe(0);
    });

    it('activates Breaker shred and Reaper execute at their duos', () => {
        const defs = [
            def('jolt'),
            def('sledge'),
            def('gutter'),
            def('arclight'),
        ];
        const { modsFor } = computeTeamMods(defs, []);
        expect(modsFor(def('jolt')).armorShredPerHit).toBe(4);
        expect(modsFor(def('gutter')).executeDamageBonus).toBeCloseTo(0.45);
        expect(modsFor(def('jolt')).executeDamageBonus).toBe(0);
    });

    it('requires three Surgecore units for the ramp tier', () => {
        const two = computeTeamMods([def('jolt'), def('brownout')], []);
        expect(two.modsFor(def('jolt')).rampDamage).toBe(0);
        const three = computeTeamMods(
            [def('jolt'), def('brownout'), def('dynamo')],
            [],
        );
        expect(three.modsFor(def('jolt')).rampDamage).toBeCloseTo(0.08);
    });

    it('grants Bladeform its per-kill attack speed', () => {
        const { modsFor } = computeTeamMods([def('kensei')], []);
        expect(modsFor(def('kensei')).atkSpeedPerKill).toBeCloseTo(0.2);
    });

    it('folds augment team stats and trait damage in', () => {
        const augments: AugmentDef[] = [
            {
                id: 'a1',
                name: 'a1',
                tier: 'silver',
                description: '',
                effect: { type: 'teamStat', stat: 'armor', amount: 15 },
            },
            {
                id: 'a2',
                name: 'a2',
                tier: 'gold',
                description: '',
                effect: {
                    type: 'traitDamage',
                    trait: 'vulture',
                    amount: 0.18,
                },
            },
        ];
        const defs = [def('lug'), def('wake')];
        const { modsFor, team } = computeTeamMods(defs, augments);
        expect(team.armor).toBe(15);
        expect(modsFor(def('lug')).damageMult).toBeCloseTo(1.18);
        // Non-Vulture units untouched.
        expect(modsFor(def('chock')).damageMult).toBe(1);
    });
});
