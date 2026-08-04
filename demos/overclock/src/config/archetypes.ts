import type { ArchetypeDef, ArchetypeId } from './types';

/**
 * Gameplay archetypes — TFT-style combat-profile tags, orthogonal to the
 * trait web. Each describes what the unit does in a fight and which stats
 * it cares about, and selects the unit's mana profile:
 *
 * - Tanks charge mana by taking hits, barely by attacking.
 * - Fighters charge decently from both directions.
 * - Assassins and Marksmen charge from attacking and hardly from damage.
 * - Casters, Supports and Specialists use the baseline hybrid profile.
 */
export const ARCHETYPES: ArchetypeDef[] = [
    {
        id: 'tank',
        name: 'Tank',
        description:
            'Anchors the frontline and soaks hits. Cares about HP and Armor. ' +
            'Charges its ability by taking damage rather than attacking.',
        mana: { perAttack: 4, perDamage: 0.12, perHitCap: 25 },
    },
    {
        id: 'fighter',
        name: 'Fighter',
        description:
            'Melee bruiser built for long scraps. Cares about HP, ATK and ' +
            'attack speed. Builds mana both dealing and taking damage.',
        mana: { perAttack: 8, perDamage: 0.09, perHitCap: 20 },
    },
    {
        id: 'assassin',
        name: 'Assassin',
        description:
            'Burst threat that hunts priority targets. Cares about ATK. ' +
            'Small mana pool; charges by attacking, and its kit rewards kills.',
        mana: { perAttack: 12, perDamage: 0.03, perHitCap: 8 },
    },
    {
        id: 'marksman',
        name: 'Marksman',
        description:
            'Backline auto-attacker. Cares about ATK, attack speed and ' +
            'Range. Abilities empower its shots rather than replace them.',
        mana: { perAttack: 10, perDamage: 0.03, perHitCap: 8 },
    },
    {
        id: 'caster',
        name: 'Caster',
        description:
            'Ability carry. Cares about Mana and spell power. Frail, but ' +
            'casts several times per fight.',
        mana: { perAttack: 12, perDamage: 0.06, perHitCap: 15 },
    },
    {
        id: 'support',
        name: 'Support',
        description:
            'Force multiplier. Cares about Mana. Heals, buffs and debuffs ' +
            'decide fights it never wins alone.',
        mana: { perAttack: 10, perDamage: 0.06, perHitCap: 15 },
    },
    {
        id: 'specialist',
        name: 'Specialist',
        description:
            'Rule-breaker. Summons, channels and mimics — judge it by its ' +
            'ability, not its stat line.',
        mana: { perAttack: 10, perDamage: 0.06, perHitCap: 15 },
    },
];

/** Lookup of archetype definitions by id. */
export const ARCHETYPE_BY_ID: ReadonlyMap<ArchetypeId, ArchetypeDef> = new Map(
    ARCHETYPES.map((a) => [a.id, a]),
);
