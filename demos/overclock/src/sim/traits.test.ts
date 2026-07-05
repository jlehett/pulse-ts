import type { AugmentDef } from '../config/types';
import { UNIT_BY_ID } from '../config/units';
import { computeTeamMods, countTraits, traitStartingMana } from './traits';

const def = (id: string) => {
    const d = UNIT_BY_ID.get(id);
    if (!d) throw new Error(`missing unit ${id}`);
    return d;
};

describe('countTraits', () => {
    it('counts unique units per trait on both axes', () => {
        // piton + bulkhead: both ferrocrete vanguards.
        const rows = countTraits([def('piton'), def('bulkhead')]);
        const ferro = rows.find((r) => r.id === 'ferrocrete');
        const van = rows.find((r) => r.id === 'vanguard');
        expect(ferro?.count).toBe(2);
        expect(ferro?.tier).toBe(0);
        expect(van?.count).toBe(2);
        expect(van?.tier).toBe(0);
    });

    it('ignores duplicate copies of the same unit', () => {
        const rows = countTraits([def('piton'), def('piton')]);
        const ferro = rows.find((r) => r.id === 'ferrocrete');
        expect(ferro?.count).toBe(1);
        expect(ferro?.tier).toBe(-1);
    });

    it('sorts active traits first', () => {
        const rows = countTraits([def('piton'), def('bulkhead'), def('pips')]);
        expect(rows[0].tier).toBeGreaterThanOrEqual(0);
        const lastActive = rows.map((r) => r.tier >= 0).lastIndexOf(true);
        const firstInactive = rows.map((r) => r.tier >= 0).indexOf(false);
        if (firstInactive !== -1) {
            expect(lastActive).toBeLessThan(firstInactive);
        }
    });
});

describe('computeTeamMods', () => {
    it('applies role tiers only to units with the role', () => {
        const defs = [def('piton'), def('bulkhead'), def('pips')];
        const { modsFor } = computeTeamMods(defs, []);
        expect(modsFor(def('piton')).startShieldPct).toBeCloseTo(0.25);
        expect(modsFor(def('pips')).startShieldPct).toBe(0);
    });

    it('applies manufacturer tiers only to matching units', () => {
        // Two whisperline units activate the crit tier.
        const defs = [def('pips'), def('murmur'), def('piton')];
        const { modsFor } = computeTeamMods(defs, []);
        expect(modsFor(def('pips')).critChance).toBeCloseTo(0.2);
        expect(modsFor(def('piton')).critChance).toBe(0);
    });

    it('grants hexawatt starting mana at tier', () => {
        const defs = [def('sparkplug'), def('dynamo')];
        const { traits } = computeTeamMods(defs, []);
        expect(traitStartingMana(def('sparkplug'), traits)).toBe(15);
        expect(traitStartingMana(def('pips'), traits)).toBe(0);
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
                    trait: 'longshot',
                    amount: 0.18,
                },
            },
        ];
        const defs = [def('coldsnap'), def('parallax')];
        const { modsFor, team } = computeTeamMods(defs, augments);
        expect(team.armor).toBe(15);
        expect(modsFor(def('coldsnap')).damageMult).toBeCloseTo(1.18);
        // Non-longshot untouched.
        expect(modsFor(def('piton')).damageMult).toBe(1);
    });
});
