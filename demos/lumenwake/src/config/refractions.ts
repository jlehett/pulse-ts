export interface RefractionTier {
    value: number;
    description: string;
}

export interface RefractionDef {
    id: string;
    name: string;
    icon: string;
    color: number;
    tiers: [RefractionTier, RefractionTier, RefractionTier];
}

export const REFRACTION_POOL: RefractionDef[] = [
    {
        id: 'searing_beam',
        name: 'Searing Beam',
        icon: `<line x1="6" y1="18" x2="30" y2="18" stroke-width="3"/><line x1="24" y1="12" x2="30" y2="18" stroke-width="2.5"/><line x1="24" y1="24" x2="30" y2="18" stroke-width="2.5"/>`,
        color: 0xff6633,
        tiers: [
            { value: 0.15, description: '+15% primary damage' },
            { value: 0.35, description: '+35% primary damage' },
            { value: 0.6, description: '+60% primary damage' },
        ],
    },
    {
        id: 'swift_light',
        name: 'Swift Light',
        icon: `<path d="M12 8 L24 18 L12 28" stroke-width="2.5" fill="none"/><line x1="6" y1="18" x2="20" y2="18" stroke-width="1.5" opacity="0.4"/>`,
        color: 0x44ddff,
        tiers: [
            { value: 0.12, description: '+12% movement speed' },
            { value: 0.25, description: '+25% movement speed' },
            { value: 0.4, description: '+40% movement speed' },
        ],
    },
    {
        id: 'overcharge',
        name: 'Overcharge',
        icon: `<circle cx="18" cy="18" r="10" stroke-width="2" fill="none"/><line x1="18" y1="10" x2="18" y2="20" stroke-width="2.5"/><circle cx="18" cy="24" r="1.5"/>`,
        color: 0xaa66ff,
        tiers: [
            { value: 0.15, description: '15% cooldown reduction' },
            { value: 0.3, description: '30% cooldown reduction' },
            { value: 0.5, description: '50% cooldown reduction' },
        ],
    },
    {
        id: 'photon_shield',
        name: 'Photon Shield',
        icon: `<path d="M18 6 L28 12 L28 24 L18 30 L8 24 L8 12 Z" stroke-width="2" fill="none"/><circle cx="18" cy="18" r="3" stroke-width="1.5"/>`,
        color: 0x44ff88,
        tiers: [
            { value: 0.1, description: '10% chance to block damage' },
            { value: 0.2, description: '20% chance to block damage' },
            { value: 0.35, description: '35% chance to block damage' },
        ],
    },
    {
        id: 'refracted_healing',
        name: 'Refracted Healing',
        icon: `<line x1="18" y1="10" x2="18" y2="26" stroke-width="2.5"/><line x1="10" y1="18" x2="26" y2="18" stroke-width="2.5"/><circle cx="18" cy="18" r="10" stroke-width="1.5" fill="none" opacity="0.3"/>`,
        color: 0x66ff66,
        tiers: [
            { value: 3, description: 'Heal 3 HP on kill' },
            { value: 6, description: 'Heal 6 HP on kill' },
            { value: 10, description: 'Heal 10 HP on kill' },
        ],
    },
    {
        id: 'convergent_focus',
        name: 'Convergent Focus',
        icon: `<circle cx="18" cy="18" r="4" stroke-width="2"/><line x1="18" y1="6" x2="18" y2="12" stroke-width="1.5"/><line x1="18" y1="24" x2="18" y2="30" stroke-width="1.5"/><line x1="6" y1="18" x2="12" y2="18" stroke-width="1.5"/><line x1="24" y1="18" x2="30" y2="18" stroke-width="1.5"/>`,
        color: 0xffaa22,
        tiers: [
            { value: 0.25, description: '+25% damage while stationary' },
            { value: 0.5, description: '+50% damage while stationary' },
            { value: 0.8, description: '+80% damage while stationary' },
        ],
    },
    {
        id: 'cascade',
        name: 'Cascade',
        icon: `<circle cx="12" cy="12" r="5" stroke-width="1.5" fill="none"/><circle cx="24" cy="12" r="5" stroke-width="1.5" fill="none"/><circle cx="18" cy="24" r="5" stroke-width="1.5" fill="none"/><line x1="16" y1="13" x2="20" y2="22" stroke-width="1" opacity="0.4"/>`,
        color: 0x88bbff,
        tiers: [
            { value: 0.08, description: '8% chance to reset ability cooldown' },
            {
                value: 0.15,
                description: '15% chance to reset ability cooldown',
            },
            {
                value: 0.25,
                description: '25% chance to reset ability cooldown',
            },
        ],
    },
    {
        id: 'chain_light',
        name: 'Chain Light',
        icon: `<polyline points="8,12 16,24 24,10 30,22" stroke-width="2.5" fill="none"/><circle cx="8" cy="12" r="2" stroke-width="1"/><circle cx="30" cy="22" r="2" stroke-width="1"/>`,
        color: 0xffee44,
        tiers: [
            { value: 1, description: 'Kills chain to 1 nearby enemy' },
            { value: 2, description: 'Kills chain to 2 nearby enemies' },
            { value: 3, description: 'Kills chain to 3 nearby enemies' },
        ],
    },
    {
        id: 'afterglow',
        name: 'Afterglow',
        icon: `<circle cx="18" cy="18" r="8" stroke-width="1.5" fill="none"/><circle cx="18" cy="18" r="4" stroke-width="2" fill="none" opacity="0.6"/><circle cx="18" cy="18" r="12" stroke-width="1" fill="none" opacity="0.3"/>`,
        color: 0xff8844,
        tiers: [
            { value: 5, description: 'Kill pools deal 5 damage/sec' },
            { value: 10, description: 'Kill pools deal 10 damage/sec' },
            { value: 18, description: 'Kill pools deal 18 damage/sec' },
        ],
    },
    {
        id: 'radiant_armor',
        name: 'Radiant Armor',
        icon: `<path d="M18 6 L30 14 L30 26 L18 30 L6 26 L6 14 Z" stroke-width="2" fill="none"/><line x1="18" y1="14" x2="18" y2="24" stroke-width="2"/><line x1="12" y1="18" x2="24" y2="18" stroke-width="1.5" opacity="0.5"/>`,
        color: 0xffd700,
        tiers: [
            { value: 0.15, description: '15% damage reduction' },
            { value: 0.3, description: '30% damage reduction' },
            { value: 0.45, description: '45% damage reduction' },
        ],
    },
    {
        id: 'prismatic_burst',
        name: 'Prismatic Burst',
        icon: `<circle cx="18" cy="18" r="6" stroke-width="2"/><line x1="18" y1="6" x2="18" y2="10" stroke-width="2"/><line x1="18" y1="26" x2="18" y2="30" stroke-width="2"/><line x1="6" y1="18" x2="10" y2="18" stroke-width="2"/><line x1="26" y1="18" x2="30" y2="18" stroke-width="2"/><line x1="9" y1="9" x2="12" y2="12" stroke-width="1.5"/><line x1="24" y1="24" x2="27" y2="27" stroke-width="1.5"/>`,
        color: 0xdd66ff,
        tiers: [
            { value: 15, description: 'AoE burst on ability use (15 dmg)' },
            { value: 30, description: 'AoE burst on ability use (30 dmg)' },
            { value: 50, description: 'AoE burst on ability use (50 dmg)' },
        ],
    },
    {
        id: 'void_resistance',
        name: 'Void Resistance',
        icon: `<circle cx="18" cy="18" r="10" stroke-width="2" fill="none"/><path d="M12 14 Q18 22 24 14" stroke-width="2" fill="none"/><line x1="18" y1="20" x2="18" y2="26" stroke-width="1.5"/>`,
        color: 0x9966cc,
        tiers: [
            { value: 0.2, description: '20% max health increase' },
            { value: 0.4, description: '40% max health increase' },
            { value: 0.65, description: '65% max health increase' },
        ],
    },
    {
        id: 'lux_magnet',
        name: 'Lux Magnet',
        icon: `<circle cx="18" cy="18" r="10" stroke-width="1.5" fill="none" opacity="0.4"/><circle cx="18" cy="18" r="6" stroke-width="1.5" fill="none" opacity="0.6"/><circle cx="18" cy="18" r="2" stroke-width="2"/>`,
        color: 0xeedd44,
        tiers: [
            { value: 2, description: 'Heal 2 HP per wave survived' },
            { value: 5, description: 'Heal 5 HP per wave survived' },
            { value: 10, description: 'Heal 10 HP per wave survived' },
        ],
    },
    {
        id: 'luminous_overload',
        name: 'Luminous Overload',
        icon: `<circle cx="18" cy="18" r="10" stroke-width="2" fill="none"/><line x1="18" y1="8" x2="18" y2="14" stroke-width="2.5"/><line x1="18" y1="22" x2="18" y2="28" stroke-width="2.5"/><line x1="8" y1="18" x2="14" y2="18" stroke-width="2.5"/><line x1="22" y1="18" x2="28" y2="18" stroke-width="2.5"/>`,
        color: 0xff4466,
        tiers: [
            { value: 8, description: 'Damage nova every 8 seconds' },
            { value: 5, description: 'Damage nova every 5 seconds' },
            { value: 3, description: 'Damage nova every 3 seconds' },
        ],
    },
    {
        id: 'resonance',
        name: 'Resonance',
        icon: `<path d="M10 10 Q18 6 26 10" stroke-width="2" fill="none"/><path d="M10 18 Q18 14 26 18" stroke-width="2" fill="none"/><path d="M10 26 Q18 22 26 26" stroke-width="2" fill="none"/>`,
        color: 0x44ffcc,
        tiers: [
            { value: 0.1, description: '+10% fire rate' },
            { value: 0.2, description: '+20% fire rate' },
            { value: 0.35, description: '+35% fire rate' },
        ],
    },
];

/**
 * Pick `count` unique random refractions from the pool, excluding any
 * that are already at max tier (tier 3).
 */
export function pickRandomRefractions(
    count: number,
    activeTiers: ReadonlyMap<string, number>,
): RefractionDef[] {
    const available = REFRACTION_POOL.filter(
        (r) => (activeTiers.get(r.id) ?? 0) < 3,
    );

    const shuffled = [...available];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, Math.min(count, shuffled.length));
}
