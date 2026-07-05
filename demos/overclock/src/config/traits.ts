import type { TraitDef, TraitId } from './types';

/**
 * The Manufacturer axis — who built the construct. Manufacturer bonuses
 * apply to units of that manufacturer only.
 */
export const MANUFACTURERS: TraitDef[] = [
    {
        id: 'hexawatt',
        axis: 'manufacturer',
        name: 'Hexawatt',
        description:
            'Hexawatt reactors run hot: their constructs enter combat pre-charged and cast harder.',
        color: '#38e8ff',
        tiers: [
            { count: 2, effect: '+15 starting mana' },
            { count: 4, effect: '+35 starting mana, abilities deal +25%' },
        ],
    },
    {
        id: 'ferrocrete',
        axis: 'manufacturer',
        name: 'Ferrocrete',
        description:
            'Ferrocrete hulls layer plating mid-fight, armoring up every second combat lasts.',
        color: '#cfcfda',
        tiers: [
            { count: 2, effect: 'Gain 4 armor per second' },
            { count: 4, effect: 'Gain 10 armor per second' },
        ],
    },
    {
        id: 'whisperline',
        axis: 'manufacturer',
        name: 'Whisperline',
        description:
            'Whisperline optics find the seam: their attacks can critically strike for 150%.',
        color: '#c98bff',
        tiers: [
            { count: 2, effect: '+20% critical chance' },
            { count: 4, effect: '+45% critical chance' },
        ],
    },
    {
        id: 'scrapline',
        axis: 'manufacturer',
        name: 'Scrapline',
        description:
            'Scrapline salvage rigs strip fallen enemies for parts, paying out gold on kills.',
        color: '#ffcf5c',
        tiers: [
            { count: 2, effect: 'Kills: 30% chance of +1 gold' },
            { count: 4, effect: 'Kills: 60% chance of +1 gold' },
        ],
    },
    {
        id: 'cryostat',
        axis: 'manufacturer',
        name: 'Cryostat',
        description:
            'Cryostat coolant weaponry chills targets, slowing their attack speed.',
        color: '#7fd0e0',
        tiers: [
            { count: 2, effect: 'Attacks slow attack speed 15% for 2s' },
            { count: 4, effect: 'Attacks slow attack speed 30% for 2s' },
        ],
    },
];

/**
 * The Role axis — what the construct does on the board. Role bonuses apply
 * to units of that role only.
 */
export const ROLES: TraitDef[] = [
    {
        id: 'vanguard',
        axis: 'role',
        name: 'Vanguard',
        description:
            'Vanguards raise energy shields at combat start, anchoring the frontline.',
        color: '#e8b563',
        tiers: [
            { count: 2, effect: 'Shield for 25% of max HP' },
            { count: 4, effect: 'Shield for 50% of max HP' },
        ],
    },
    {
        id: 'breacher',
        axis: 'role',
        name: 'Breacher',
        description:
            'Breachers hit harder the longer combat runs, ramping flat attack damage.',
        color: '#ff8c5a',
        tiers: [
            { count: 2, effect: '+4 attack damage per second' },
            { count: 4, effect: '+9 attack damage per second' },
        ],
    },
    {
        id: 'gunner',
        axis: 'role',
        name: 'Gunner',
        description:
            'Gunners spool up with every shot, stacking attack speed (max 10 stacks).',
        color: '#d98c56',
        tiers: [
            { count: 2, effect: '+4% attack speed per attack' },
            { count: 4, effect: '+9% attack speed per attack' },
        ],
    },
    {
        id: 'longshot',
        axis: 'role',
        name: 'Longshot',
        description:
            'Longshots deal bonus damage scaling with the distance to their target.',
        color: '#ffd23f',
        tiers: [
            { count: 2, effect: '+8% damage per hex to target' },
            { count: 4, effect: '+15% damage per hex to target' },
        ],
    },
    {
        id: 'swarm',
        axis: 'role',
        name: 'Swarm',
        description:
            'Swarm frames are hard to pin down, dodging a share of incoming attacks.',
        color: '#7fd0e0',
        tiers: [
            { count: 2, effect: '15% chance to dodge attacks' },
            { count: 4, effect: '35% chance to dodge attacks' },
        ],
    },
    {
        id: 'catalyst',
        axis: 'role',
        name: 'Catalyst',
        description:
            'Catalysts run perpetual charge cycles, generating mana passively.',
        color: '#b45cff',
        tiers: [
            { count: 2, effect: '+3 mana per second' },
            { count: 4, effect: '+7 mana per second' },
        ],
    },
];

/** All traits on both axes. */
export const TRAITS: TraitDef[] = [...MANUFACTURERS, ...ROLES];

/** Lookup of trait definitions by id. */
export const TRAIT_BY_ID: ReadonlyMap<TraitId, TraitDef> = new Map(
    TRAITS.map((t) => [t.id, t]),
);

/**
 * Returns the highest active tier index for a trait given a unique-unit
 * count, or -1 when inactive.
 *
 * @param trait - Trait definition.
 * @param count - Number of unique units carrying the trait.
 * @returns Index into `trait.tiers`, or -1.
 *
 * @example
 * activeTier(TRAIT_BY_ID.get('gunner')!, 3); // 0 (the 2-piece tier)
 */
export function activeTier(trait: TraitDef, count: number): number {
    let tier = -1;
    for (let i = 0; i < trait.tiers.length; i++) {
        if (count >= trait.tiers[i].count) tier = i;
    }
    return tier;
}
