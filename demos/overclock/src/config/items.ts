import type { ItemDef } from './types';

/** Maximum items (components or combined) equipped on one unit. */
export const MAX_ITEMS_PER_UNIT = 3;

/**
 * Base components dropped from battle victories. Two components equipped on
 * the same unit auto-fuse into the combined item whose recipe matches.
 */
export const COMPONENTS: ItemDef[] = [
    {
        id: 'cell',
        name: 'Power Cell',
        description: 'A raw energy cell. +15 attack damage.',
        stats: { atk: 15 },
        color: '#ff6b4a',
    },
    {
        id: 'core',
        name: 'Logic Core',
        description: 'A salvaged co-processor. +15% ability power.',
        stats: { ap: 0.15 },
        color: '#b98cff',
    },
    {
        id: 'coil',
        name: 'Servo Coil',
        description: 'High-torque actuator wire. +15% attack speed.',
        stats: { atkSpeed: 0.15 },
        color: '#ffd24a',
    },
    {
        id: 'plate',
        name: 'Plasteel Plate',
        description: 'Layered hull armor. +15 armor.',
        stats: { armor: 15 },
        color: '#8fb7c9',
    },
    {
        id: 'frame',
        name: 'Hydraulic Frame',
        description: 'Reinforced chassis struts. +150 max HP.',
        stats: { hp: 150 },
        color: '#6ee787',
    },
    {
        id: 'flux',
        name: 'Flux Capacitor',
        description: 'A precharged mana lattice. +15 starting mana.',
        stats: { mana: 15 },
        color: '#4ac9ff',
    },
];

/**
 * Combined items — one per unordered component pair (15 mixed + 6 doubles).
 * Each keeps both components' stats and adds a unique passive implemented in
 * `sim/items.ts`.
 */
export const COMBINED_ITEMS: ItemDef[] = [
    {
        id: 'railgunChassis',
        name: 'Railgun Chassis',
        description:
            'Attacks pierce, also striking the enemy in the hex directly behind the target.',
        stats: { atk: 30 },
        color: '#ff4d2e',
        recipe: ['cell', 'cell'],
        effect: 'railgun',
    },
    {
        id: 'hybridActuator',
        name: 'Hybrid Actuator',
        description:
            'After each cast, the next 3 attacks deal +30 bonus damage (scales with AP).',
        stats: { atk: 15, ap: 0.15 },
        color: '#e07bd8',
        recipe: ['cell', 'core'],
        effect: 'hybridActuator',
    },
    {
        id: 'overheatDriver',
        name: 'Overheat Driver',
        description:
            'Each attack grants +4% attack speed, stacking. At 20 stacks it overheats: vents a burn onto adjacent enemies (scales with AP), singes itself, and resets.',
        stats: { atk: 15, atkSpeed: 0.15 },
        color: '#ff9a3d',
        recipe: ['cell', 'coil'],
        effect: 'overheat',
    },
    {
        id: 'kineticRam',
        name: 'Kinetic Ram',
        description:
            'Every 4th attack knocks the target back one hex and slows it 30% for 2s.',
        stats: { atk: 15, armor: 15 },
        color: '#d98a6a',
        recipe: ['cell', 'plate'],
        effect: 'kineticRam',
    },
    {
        id: 'salvageClaws',
        name: 'Salvage Claws',
        description:
            'Kills permanently grant +10 attack damage and restore 20% max HP.',
        stats: { atk: 15, hp: 150 },
        color: '#a8d95c',
        recipe: ['cell', 'frame'],
        effect: 'salvageClaws',
    },
    {
        id: 'voltageSpike',
        name: 'Voltage Spike',
        description:
            'Attacks burn 8 mana from the target and deal +2 damage per point burned.',
        stats: { atk: 15, mana: 15 },
        color: '#ff7bd0',
        recipe: ['cell', 'flux'],
        effect: 'voltageSpike',
    },
    {
        id: 'echoProcessor',
        name: 'Echo Processor',
        description:
            'The first cast each combat automatically repeats 1s later at 40% power.',
        stats: { ap: 0.3 },
        color: '#9a5cff',
        recipe: ['core', 'core'],
        effect: 'echoProcessor',
    },
    {
        id: 'predictiveTargeting',
        name: 'Predictive Targeting',
        description: 'Each cast grants +25% attack speed for 4s.',
        stats: { ap: 0.15, atkSpeed: 0.15 },
        color: '#d9b84a',
        recipe: ['core', 'coil'],
        effect: 'predictiveTargeting',
    },
    {
        id: 'firewallMatrix',
        name: 'Firewall Matrix',
        description:
            'Casting grants a 120 shield (scales with AP). Enemies that strike the shield are Discorded, taking +15% damage for 4s.',
        stats: { ap: 0.15, armor: 15 },
        color: '#8f9ee0',
        recipe: ['core', 'plate'],
        effect: 'firewallMatrix',
    },
    {
        id: 'repairSubroutine',
        name: 'Repair Subroutine',
        description: 'Casts also heal the holder for 120 (scales with AP).',
        stats: { ap: 0.15, hp: 150 },
        color: '#7bd9a8',
        recipe: ['core', 'frame'],
        effect: 'repairSubroutine',
    },
    {
        id: 'overclockKernel',
        name: 'Overclock Kernel',
        description:
            'Each cast permanently grants +10% ability power this combat, stacking.',
        stats: { ap: 0.15, mana: 15 },
        color: '#7b8cff',
        recipe: ['core', 'flux'],
        effect: 'overclockKernel',
    },
    {
        id: 'gatlingConversion',
        name: 'Gatling Conversion',
        description: '+60% attack speed, but attacks deal 25% less damage.',
        stats: { atkSpeed: 0.6 },
        color: '#ffe066',
        recipe: ['coil', 'coil'],
        effect: 'gatling',
    },
    {
        id: 'bunkerServos',
        name: 'Bunker Servos',
        description:
            'While the holder has not moved this combat, it gains +2 armor and +2% attack speed per second.',
        stats: { atkSpeed: 0.15, armor: 15 },
        color: '#c9c27b',
        recipe: ['coil', 'plate'],
        effect: 'bunkerServos',
    },
    {
        id: 'momentumFlywheel',
        name: 'Momentum Flywheel',
        description:
            'The flywheel never stops: gains +2% damage and +2% attack speed for every second in combat.',
        stats: { atkSpeed: 0.15, hp: 150 },
        color: '#b8e05c',
        recipe: ['coil', 'frame'],
        effect: 'momentumFlywheel',
    },
    {
        id: 'inductionCoil',
        name: 'Induction Coil',
        description:
            "The holder's attacks also grant 2 mana to adjacent allies.",
        stats: { atkSpeed: 0.15, mana: 15 },
        color: '#7bd9e0',
        recipe: ['coil', 'flux'],
        effect: 'inductionCoil',
    },
    {
        id: 'ablativeStack',
        name: 'Ablative Stack',
        description:
            'Armor cannot be shredded. Each hit taken grants +2 armor (up to +40).',
        stats: { armor: 30 },
        color: '#6a92a8',
        recipe: ['plate', 'plate'],
        effect: 'ablativeStack',
    },
    {
        id: 'emergencyBulkhead',
        name: 'Emergency Bulkhead',
        description:
            'Once per combat, when dropping below 50% HP: cleanses debuffs, shields 25% max HP, and knocks back adjacent enemies.',
        stats: { armor: 15, hp: 150 },
        color: '#7bc9a0',
        recipe: ['plate', 'frame'],
        effect: 'emergencyBulkhead',
    },
    {
        id: 'groundingRods',
        name: 'Grounding Rods',
        description:
            'Immune to stuns and slows. Each one blocked grants 10 mana.',
        stats: { armor: 15, mana: 15 },
        color: '#6ab0d9',
        recipe: ['plate', 'flux'],
        effect: 'groundingRods',
    },
    {
        id: 'foundryCore',
        name: 'Foundry Core',
        description:
            "On death, the wreck reassembles into a sentry token with 50% of the holder's max HP.",
        stats: { hp: 300 },
        color: '#4ad96a',
        recipe: ['frame', 'frame'],
        effect: 'foundryCore',
    },
    {
        id: 'coolantReservoir',
        name: 'Coolant Reservoir',
        description:
            'Mana gained from taking damage is uncapped and increased 50%. Casting heals 8% max HP.',
        stats: { hp: 150, mana: 15 },
        color: '#5ce0c0',
        recipe: ['frame', 'flux'],
        effect: 'coolantReservoir',
    },
    {
        id: 'prechargedCapacitors',
        name: 'Precharged Capacitors',
        description:
            'Starts combat at full mana. After the first cast, casts cost 20% less mana.',
        stats: { mana: 30 },
        color: '#2ea8ff',
        recipe: ['flux', 'flux'],
        effect: 'prechargedCapacitors',
    },
];

/** All items (components + combined), keyed by id. */
export const ITEM_BY_ID: ReadonlyMap<string, ItemDef> = new Map(
    [...COMPONENTS, ...COMBINED_ITEMS].map((item) => [item.id, item]),
);

/**
 * True when an item id refers to a base component (fusable, transferable).
 *
 * @param id - Item id.
 * @returns Whether the id is one of the six base components.
 *
 * @example
 * isComponent('cell'); // true
 * isComponent('railgunChassis'); // false
 */
export function isComponent(id: string): boolean {
    return COMPONENTS.some((c) => c.id === id);
}

/**
 * Looks up the combined item produced by fusing two components
 * (order-insensitive).
 *
 * @param a - First component id.
 * @param b - Second component id.
 * @returns The combined {@link ItemDef}, or null when either id is not a
 * component.
 *
 * @example
 * combineItems('cell', 'core')?.name; // 'Hybrid Actuator'
 */
export function combineItems(a: string, b: string): ItemDef | null {
    return (
        COMBINED_ITEMS.find(
            (item) =>
                (item.recipe![0] === a && item.recipe![1] === b) ||
                (item.recipe![0] === b && item.recipe![1] === a),
        ) ?? null
    );
}
