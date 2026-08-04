import type { TraitDef, TraitId } from './types';

/**
 * The Manufacturer axis — who built the construct. Manufacturer bonuses
 * apply to units of that manufacturer only. Every trait has a single
 * mechanic whose magnitude scales with tier.
 */
export const MANUFACTURERS: TraitDef[] = [
    {
        id: 'aegisline',
        axis: 'manufacturer',
        name: 'Aegisline',
        description:
            'Aegisline hulls project hardlight barriers, and fight harder while the barrier holds.',
        color: '#63b3ff',
        tiers: [
            {
                count: 2,
                effect: 'Start with a 200 barrier; +15% damage while shielded',
            },
            {
                count: 4,
                effect: 'Start with a 450 barrier; +15% damage while shielded',
            },
            {
                count: 6,
                effect: 'Start with a 900 barrier; +15% damage while shielded',
            },
        ],
    },
    {
        id: 'redline',
        axis: 'manufacturer',
        name: 'Redline Motors',
        description:
            'Redline drivetrains never idle: their weapons stay spooled past the redline for the whole fight.',
        color: '#ff4f5e',
        tiers: [
            { count: 2, effect: 'Redline units gain +25% attack speed' },
            { count: 4, effect: 'Redline units gain +60% attack speed' },
        ],
    },
    {
        id: 'blacksite',
        axis: 'manufacturer',
        name: 'Blacksite',
        description:
            'Blacksite intrusion suites bleed hostile batteries dry, siphoning mana with every hit.',
        color: '#b45cff',
        tiers: [
            { count: 2, effect: 'Attacks siphon 3 mana from the target' },
            { count: 4, effect: 'Attacks siphon 7 mana from the target' },
        ],
    },
    {
        id: 'blastworks',
        axis: 'manufacturer',
        name: 'Blastworks',
        description:
            'Blastworks munitions never hit just one thing: attacks splash to hexes adjacent to the target.',
        color: '#ffab3d',
        tiers: [
            { count: 2, effect: 'Attacks splash 20% damage to adjacent hexes' },
            { count: 4, effect: 'Attacks splash 40% damage to adjacent hexes' },
            { count: 6, effect: 'Attacks splash 65% damage to adjacent hexes' },
        ],
    },
    {
        id: 'hardlight',
        axis: 'manufacturer',
        name: 'Hardlight',
        description:
            'Hardlight photonics resist deletion: destroyed frames re-form once per combat.',
        color: '#5ce8c8',
        tiers: [
            { count: 2, effect: 'Re-form once after dying, with 15% HP' },
            { count: 4, effect: 'Re-form once after dying, with 40% HP' },
        ],
    },
    {
        id: 'vulture',
        axis: 'manufacturer',
        name: 'Vulture Cartel',
        description:
            'Vulture frames are built from what they kill: every hit strips something usable off the target.',
        color: '#a3c153',
        tiers: [
            { count: 2, effect: 'Attacks heal for 12% of damage dealt' },
            { count: 4, effect: 'Attacks heal for 22% of damage dealt' },
            { count: 6, effect: 'Attacks heal for 35% of damage dealt' },
        ],
    },
    {
        id: 'surgecore',
        axis: 'manufacturer',
        name: 'Surgecore',
        description:
            'Surgecore reactors run past redline the longer a fight lasts, trading stability for output.',
        color: '#ff5cf0',
        tiers: [
            { count: 3, effect: '+8% damage every 4s in combat (stacking)' },
            { count: 5, effect: '+18% damage every 4s in combat (stacking)' },
        ],
    },
];

/**
 * The Role axis — what the construct does on the board. Role bonuses apply
 * to units of that role only.
 */
export const ROLES: TraitDef[] = [
    {
        id: 'turret',
        axis: 'role',
        name: 'Turret',
        description:
            'Turrets dig in: while they hold their starting hex they stack attack speed every second.',
        color: '#ffd23f',
        tiers: [
            {
                count: 2,
                effect: '+7% attack speed per second while stationary',
            },
            {
                count: 4,
                effect: '+14% attack speed per second while stationary',
            },
        ],
    },
    {
        id: 'flanker',
        axis: 'role',
        name: 'Flanker',
        description:
            'Flankers deploy straight into the enemy backline and grow deadlier with every kill.',
        color: '#ff8c5a',
        tiers: [
            {
                count: 3,
                effect: 'Spawn in the enemy backline; +15% damage per kill',
            },
            {
                count: 5,
                effect: 'Spawn in the enemy backline; +35% damage per kill',
            },
        ],
    },
    {
        id: 'bulwark',
        axis: 'role',
        name: 'Bulwark',
        description:
            'Bulwarks shoulder the line, intercepting damage aimed at adjacent allies.',
        color: '#e8b563',
        tiers: [
            {
                count: 2,
                effect: 'Intercept 15% of damage to adjacent allies; take 15% less',
            },
            {
                count: 4,
                effect: 'Intercept 30% of damage to adjacent allies; take 15% less',
            },
        ],
    },
    {
        id: 'juggernaut',
        axis: 'role',
        name: 'Juggernaut',
        description:
            'Juggernauts refuse to stay broken, welding themselves back together mid-fight.',
        color: '#9fb4d1',
        tiers: [
            { count: 2, effect: 'Regenerate 1.5% max HP per second' },
            { count: 4, effect: 'Regenerate 3.5% max HP per second' },
        ],
    },
    {
        id: 'breaker',
        axis: 'role',
        name: 'Breaker',
        description:
            'Breakers tear plating off with every blow, leaving targets softer for everyone.',
        color: '#c47a52',
        tiers: [
            { count: 2, effect: 'Attacks shred 4 armor from the target' },
            { count: 4, effect: 'Attacks shred 9 armor from the target' },
        ],
    },
    {
        id: 'reaper',
        axis: 'role',
        name: 'Reaper',
        description:
            'Reapers work in pairs, and they only care about targets that are already bleeding.',
        color: '#c73e6b',
        tiers: [
            {
                count: 2,
                effect: '+45% damage to enemies below half HP',
            },
        ],
    },
    {
        id: 'medic',
        axis: 'role',
        name: 'Medic',
        description:
            'Medic frames run field-repair protocols; their overhealing hardens into shields.',
        color: '#7fe08f',
        tiers: [
            {
                count: 2,
                effect: 'Medics heal 25% more; overheal becomes shield',
            },
            {
                count: 4,
                effect: 'Medics heal 60% more; overheal becomes shield',
            },
        ],
    },
    {
        id: 'bombardier',
        axis: 'role',
        name: 'Bombardier',
        description:
            'Bombardiers lob every third shot in a high arc that crashes down and splashes.',
        color: '#d98c56',
        tiers: [
            {
                count: 2,
                effect: 'Every 3rd attack: +50% damage, splashes to adjacent hexes',
            },
            {
                count: 4,
                effect: 'Every 3rd attack: +110% damage, splashes to adjacent hexes',
            },
        ],
    },
    {
        id: 'amplifier',
        axis: 'role',
        name: 'Amplifier',
        description:
            'Amplifiers paint targets with discord: everything hits the marked unit harder.',
        color: '#c98bff',
        tiers: [
            {
                count: 2,
                effect: 'Attacks Discord the target: +10% damage taken for 4s',
            },
            {
                count: 4,
                effect: 'Attacks Discord the target: +22% damage taken for 4s',
            },
        ],
    },
];

/**
 * Prime traits — one-of-a-kind traits carried by cost-5 constructs. Active
 * the moment the Prime is fielded (count 1). Primes carry no manufacturer
 * or role.
 */
export const PRIMES: TraitDef[] = [
    {
        id: 'iris',
        axis: 'prime',
        name: 'Iris',
        description: 'Meridian sees the flaw in everything it touches.',
        color: '#ffe08a',
        tiers: [
            {
                count: 1,
                effect: 'Attacks permanently Discord the target (+20% damage taken)',
            },
        ],
    },
    {
        id: 'zero-day',
        axis: 'prime',
        name: 'Zero-Day',
        description: 'Blackout is already inside every hostile system.',
        color: '#ffe08a',
        tiers: [{ count: 1, effect: 'Enemies start combat with -20 mana' }],
    },
    {
        id: 'emplacement',
        axis: 'prime',
        name: 'Emplacement',
        description: 'Citadel does not advance. Citadel does not retreat.',
        color: '#ffe08a',
        tiers: [
            {
                count: 1,
                effect: 'Never moves; +2 range and attacks splash to adjacent hexes',
            },
        ],
    },
    {
        id: 'guardian-protocol',
        axis: 'prime',
        name: 'Guardian Protocol',
        description: 'Valkyr does not accept losses on its watch.',
        color: '#ffe08a',
        tiers: [
            {
                count: 1,
                effect: 'The first ally to die is rebuilt after 2.5s with 40% HP',
            },
        ],
    },
    {
        id: 'adaptive-core',
        axis: 'prime',
        name: 'Adaptive Core',
        description: 'Facsimile is whoever your army needs it to be.',
        color: '#ffe08a',
        tiers: [
            {
                count: 1,
                effect: 'At combat start, becomes a copy of your strongest other unit',
            },
        ],
    },
    {
        id: 'bladeform',
        axis: 'prime',
        name: 'Bladeform',
        description: 'Kensei has never needed a second draw.',
        color: '#ffe08a',
        tiers: [
            {
                count: 1,
                effect: 'Kills permanently grant +20% attack speed this combat',
            },
        ],
    },
];

/** All traits on all axes. */
export const TRAITS: TraitDef[] = [...MANUFACTURERS, ...ROLES, ...PRIMES];

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
 * activeTier(TRAIT_BY_ID.get('turret')!, 3); // 0 (the 2-piece tier)
 */
export function activeTier(trait: TraitDef, count: number): number {
    let tier = -1;
    for (let i = 0; i < trait.tiers.length; i++) {
        if (count >= trait.tiers[i].count) tier = i;
    }
    return tier;
}
