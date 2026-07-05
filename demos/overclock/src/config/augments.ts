import type { AugmentDef } from './types';

/**
 * Augment pool. Offered as pick-1-of-3 after elite victories and at fixed
 * floors. Tier affects weighting: prismatic augments only appear from the
 * later floors.
 */
export const AUGMENTS: AugmentDef[] = [
    {
        id: 'overcharged-core',
        name: 'Overcharged Core',
        tier: 'prismatic',
        description: 'Your constructs gain +20 starting mana.',
        effect: { type: 'startingMana', amount: 20 },
    },
    {
        id: 'plated-chassis',
        name: 'Plated Chassis',
        tier: 'silver',
        description: 'Your constructs gain +15 armor.',
        effect: { type: 'teamStat', stat: 'armor', amount: 15 },
    },
    {
        id: 'servo-tuning',
        name: 'Servo Tuning',
        tier: 'silver',
        description: 'Your constructs gain +10% attack speed.',
        effect: { type: 'teamStat', stat: 'atkSpeed', amount: 0.1 },
    },
    {
        id: 'heavy-actuators',
        name: 'Heavy Actuators',
        tier: 'gold',
        description: 'Your constructs gain +12 attack damage.',
        effect: { type: 'teamStat', stat: 'atk', amount: 12 },
    },
    {
        id: 'reinforced-hulls',
        name: 'Reinforced Hulls',
        tier: 'gold',
        description: 'Your constructs gain +120 max HP.',
        effect: { type: 'teamStat', stat: 'hp', amount: 120 },
    },
    {
        id: 'compound-interest',
        name: 'Compound Interest',
        tier: 'gold',
        description: 'Interest cap raised by +2.',
        effect: { type: 'interestCap', amount: 2 },
    },
    {
        id: 'surplus-requisition',
        name: 'Surplus Requisition',
        tier: 'silver',
        description: 'Gain 12 gold immediately.',
        effect: { type: 'goldNow', amount: 12 },
    },
    {
        id: 'bulk-discount',
        name: 'Bulk Discount',
        tier: 'gold',
        description: 'Shop refreshes cost 1 gold.',
        effect: { type: 'refreshDiscount', amount: 1 },
    },
    {
        id: 'expansion-slot',
        name: 'Expansion Slot',
        tier: 'prismatic',
        description: 'Field +1 construct beyond your level.',
        effect: { type: 'bonusTeamSize', amount: 1 },
    },
    {
        id: 'core-patch',
        name: 'Core Patch',
        tier: 'silver',
        description: 'Restore 20 core integrity.',
        effect: { type: 'coreRepair', amount: 20 },
    },
    {
        id: 'hexawatt-contract',
        name: 'Hexawatt Contract',
        tier: 'gold',
        description: 'Hexawatt constructs deal +18% damage.',
        effect: { type: 'traitDamage', trait: 'hexawatt', amount: 0.18 },
    },
    {
        id: 'longshot-doctrine',
        name: 'Longshot Doctrine',
        tier: 'gold',
        description: 'Longshot constructs deal +18% damage.',
        effect: { type: 'traitDamage', trait: 'longshot', amount: 0.18 },
    },
];

/** Lookup of augment definitions by id. */
export const AUGMENT_BY_ID: ReadonlyMap<string, AugmentDef> = new Map(
    AUGMENTS.map((a) => [a.id, a]),
);
