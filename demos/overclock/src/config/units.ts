import type { UnitDef } from './types';

/**
 * The Overclock construct roster. Standard constructs (cost 1-4) carry one
 * Manufacturer and one Role trait. Prime constructs (cost 5) carry a unique
 * Prime trait instead and sit outside the trait web.
 *
 * Every construct also carries an archetype tag (see config/archetypes.ts)
 * that shapes its stat silhouette and mana profile:
 *
 * - Tanks: ~0.55 atk speed, high HP/armor, low ATK; mana from taking hits.
 * - Fighters: 0.85-0.95 atk speed melee bruisers with cheap, spammy casts.
 * - Assassins: very high ATK, small mana pools, kill-reward kits.
 * - Marksmen: 1.05+ atk speed, low HP; abilities empower their autos.
 * - Casters: low HP/atk speed, cheap-to-mid mana costs, big spells.
 * - Supports: middling stats, ally-facing spells.
 * - Specialists: stat lines lie; the ability is the unit.
 */
export const UNITS: UnitDef[] = [
    // ── Cost 1 ────────────────────────────────────────────────────────────
    {
        id: 'pellet',
        name: 'Talon',
        cost: 1,
        manufacturer: 'redline',
        role: 'flanker',
        archetype: 'assassin',
        epithet: 'Razor Frame',
        stats: {
            hp: 460,
            atk: 60,
            atkSpeed: 0.95,
            armor: 15,
            range: 1,
            manaMax: 40,
            manaStart: 0,
        },
        ability: {
            name: 'Eviscerate',
            description:
                'Blinks behind its target and rends it for 185% AD. Kills refund 80% of its mana.',
            kind: 'phantom',
            power: { adRatio: 1.85 },
            aux: 0.8,
        },
    },
    {
        id: 'chock',
        name: 'Chock',
        cost: 1,
        manufacturer: 'aegisline',
        role: 'bulwark',
        archetype: 'tank',
        epithet: 'Wheel Brake',
        stats: {
            hp: 680,
            atk: 40,
            atkSpeed: 0.55,
            armor: 50,
            range: 1,
            manaMax: 60,
            manaStart: 10,
        },
        ability: {
            name: 'Shield Bash',
            description:
                'Slams its target for 175% AD and raises a barrier equal to 400% of its armor, scaled by AP.',
            kind: 'bastion',
            power: { adRatio: 1.75 },
            secondary: { armorRatio: 4, apScaled: true },
        },
    },
    {
        id: 'gauze',
        name: 'Gauze',
        cost: 1,
        manufacturer: 'hardlight',
        role: 'medic',
        archetype: 'support',
        epithet: 'Suture Drone',
        stats: {
            hp: 470,
            atk: 40,
            atkSpeed: 0.7,
            armor: 15,
            range: 3,
            manaMax: 50,
            manaStart: 0,
        },
        ability: {
            name: 'Patch Beam',
            description:
                'Restores 150 HP (AP) to the lowest-HP ally, splashing 60 HP (AP) to allies adjacent to them.',
            kind: 'triage',
            power: { base: 150, apScaled: true },
            secondary: { base: 60, apScaled: true },
        },
    },
    {
        id: 'fuze',
        name: 'Fuze',
        cost: 1,
        manufacturer: 'blastworks',
        role: 'bombardier',
        archetype: 'caster',
        epithet: 'Bounce Grenadier',
        stats: {
            hp: 440,
            atk: 38,
            atkSpeed: 0.65,
            armor: 12,
            range: 3,
            manaMax: 55,
            manaStart: 0,
        },
        ability: {
            name: 'Lob Charge',
            description:
                'Bounces a grenade onto its target for a 130-damage (AP) blast; the pin skips to a second random enemy for half.',
            kind: 'bounce',
            power: { base: 130, apScaled: true },
            aux: 0.5,
        },
    },
    {
        id: 'static',
        name: 'Static',
        cost: 1,
        manufacturer: 'blacksite',
        role: 'amplifier',
        archetype: 'caster',
        epithet: 'Noise Beacon',
        stats: {
            hp: 450,
            atk: 40,
            atkSpeed: 0.7,
            armor: 12,
            range: 3,
            manaMax: 50,
            manaStart: 0,
        },
        ability: {
            name: 'Discord Ping',
            description:
                'Zaps its target for 80 (AP) and Discords it (+15% damage taken, 4s); the ping echoes to the nearest other enemy.',
            kind: 'echo',
            power: { base: 80, apScaled: true },
            aux: 0.15,
        },
    },
    {
        id: 'tripod',
        name: 'Trestle',
        cost: 1,
        manufacturer: 'aegisline',
        role: 'turret',
        archetype: 'marksman',
        epithet: 'Picket Gun',
        stats: {
            hp: 480,
            atk: 42,
            atkSpeed: 1.15,
            armor: 20,
            range: 3,
            manaMax: 70,
            manaStart: 0,
        },
        ability: {
            name: 'Overcharge Rounds',
            description:
                'Overcharges its next 4 shots: +45 damage (AP) each, piercing one hex behind the target.',
            kind: 'overcharge',
            power: { base: 45, apScaled: true },
            aux: 4,
            aux2: 1,
        },
    },
    {
        id: 'lug',
        name: 'Lug',
        cost: 1,
        manufacturer: 'vulture',
        role: 'juggernaut',
        archetype: 'fighter',
        epithet: 'Salvage Mule',
        stats: {
            hp: 560,
            atk: 52,
            atkSpeed: 0.85,
            armor: 28,
            range: 1,
            manaMax: 55,
            manaStart: 0,
        },
        ability: {
            name: 'Strip Weld',
            description:
                'Tears 120 HP (AP) off its target and welds 230% AD of salvage onto the lowest-HP ally.',
            kind: 'drain',
            power: { base: 120, apScaled: true },
            secondary: { adRatio: 2.3 },
        },
    },
    {
        id: 'jolt',
        name: 'Jolt',
        cost: 1,
        manufacturer: 'surgecore',
        role: 'breaker',
        archetype: 'fighter',
        epithet: 'Static Prod',
        stats: {
            hp: 520,
            atk: 55,
            atkSpeed: 0.9,
            armor: 20,
            range: 1,
            manaMax: 50,
            manaStart: 0,
        },
        ability: {
            name: 'Live Wire',
            description:
                'Jabs its target for 60 + 145% AD; the current arcs to a nearby enemy for 70 (AP).',
            kind: 'chain',
            power: { base: 60, adRatio: 1.45 },
            secondary: { base: 70, apScaled: true },
        },
    },
    {
        id: 'wake',
        name: 'Wake',
        cost: 1,
        manufacturer: 'vulture',
        role: 'flanker',
        archetype: 'assassin',
        epithet: 'Carrion Skimmer',
        stats: {
            hp: 450,
            atk: 62,
            atkSpeed: 0.95,
            armor: 12,
            range: 1,
            manaMax: 45,
            manaStart: 0,
        },
        ability: {
            name: 'Pick Clean',
            description:
                'Rakes its target for 200% AD. Kills permanently grant +20% damage (stacking).',
            kind: 'feast',
            power: { adRatio: 2 },
            aux: 0.2,
        },
    },

    // ── Cost 2 ────────────────────────────────────────────────────────────
    {
        id: 'picket',
        name: 'Picket',
        cost: 2,
        manufacturer: 'blastworks',
        role: 'turret',
        archetype: 'specialist',
        epithet: 'Forge Rigger',
        stats: {
            hp: 620,
            atk: 55,
            atkSpeed: 0.8,
            armor: 28,
            range: 2,
            manaMax: 90,
            manaStart: 10,
        },
        ability: {
            name: 'Deploy Sentry',
            description:
                'Bolts a sentry gun with 180 HP (scales with AP) onto an adjacent hex. It fights until destroyed.',
            kind: 'summon',
            power: { base: 180, apScaled: true },
        },
    },
    {
        id: 'wisp',
        name: 'Wisp',
        cost: 2,
        manufacturer: 'hardlight',
        role: 'flanker',
        archetype: 'fighter',
        epithet: 'Refraction Blade',
        stats: {
            hp: 640,
            atk: 58,
            atkSpeed: 0.9,
            armor: 25,
            range: 1,
            manaMax: 45,
            manaStart: 0,
        },
        ability: {
            name: 'Prism Dash',
            description:
                'Flickers adjacent to its target and slashes for 240% AD. If the slash kills, Prism Dash instantly recasts on the nearest enemy.',
            kind: 'flicker',
            power: { adRatio: 2.4 },
        },
    },
    {
        id: 'sawbones',
        name: 'Sawbones',
        cost: 2,
        manufacturer: 'blacksite',
        role: 'medic',
        archetype: 'caster',
        epithet: 'Unlicensed Surgeon',
        stats: {
            hp: 520,
            atk: 45,
            atkSpeed: 0.65,
            armor: 15,
            range: 3,
            manaMax: 70,
            manaStart: 0,
        },
        ability: {
            name: 'Graft',
            description:
                'Drains 170 HP from its target (scales with AP) and grafts 170 HP (scales with AP) onto the lowest-HP ally.',
            kind: 'drain',
            power: { base: 170, apScaled: true },
            secondary: { base: 170, apScaled: true },
        },
    },
    {
        id: 'ramrod',
        name: 'Ramrod',
        cost: 2,
        manufacturer: 'redline',
        role: 'bulwark',
        archetype: 'tank',
        epithet: 'Crash Frame',
        stats: {
            hp: 820,
            atk: 50,
            atkSpeed: 0.55,
            armor: 55,
            range: 1,
            manaMax: 75,
            manaStart: 15,
        },
        ability: {
            name: 'Piston Charge',
            description:
                'Fires its pistons through the target: 120% AD plus 160% armor damage along the line, knocking enemies back a hex.',
            kind: 'ram',
            power: { adRatio: 1.2, armorRatio: 1.6 },
        },
    },
    {
        id: 'mortar',
        name: 'Mortar',
        cost: 2,
        manufacturer: 'aegisline',
        role: 'bombardier',
        archetype: 'caster',
        epithet: 'Arc Thrower',
        stats: {
            hp: 540,
            atk: 48,
            atkSpeed: 0.6,
            armor: 18,
            range: 4,
            manaMax: 75,
            manaStart: 0,
        },
        ability: {
            name: 'Concussive Volley',
            description:
                'Rains 3 shells on random enemies for 100 damage each (scales with AP), splashing adjacent hexes and dazing victims: -30% attack speed for 2s.',
            kind: 'concussive',
            power: { base: 100, apScaled: true },
            aux: 3,
            aux2: 0.3,
        },
    },
    {
        id: 'relay',
        name: 'Relay',
        cost: 2,
        manufacturer: 'redline',
        role: 'medic',
        archetype: 'support',
        epithet: 'Pit Crew Chief',
        stats: {
            hp: 560,
            atk: 45,
            atkSpeed: 0.75,
            armor: 20,
            range: 3,
            manaMax: 75,
            manaStart: 10,
        },
        ability: {
            name: 'Pit Stop',
            description:
                'Restores 130 HP (scales with AP) to the 3 lowest-HP allies and speeds their attacks 25% for 3s.',
            kind: 'rally',
            power: { base: 130, apScaled: true },
            aux: 3,
        },
    },
    {
        id: 'bulkhead',
        name: 'Bulkhead',
        cost: 2,
        manufacturer: 'aegisline',
        role: 'juggernaut',
        archetype: 'tank',
        epithet: 'Blast Door',
        stats: {
            hp: 850,
            atk: 46,
            atkSpeed: 0.55,
            armor: 52,
            range: 1,
            manaMax: 70,
            manaStart: 15,
        },
        ability: {
            name: 'Seal Breach',
            description:
                'Slams shut: permanently gains 40 armor (scales with AP) and knocks adjacent enemies back a hex.',
            kind: 'fortify',
            power: { base: 40, apScaled: true },
        },
    },
    {
        id: 'gutter',
        name: 'Gutter',
        cost: 2,
        manufacturer: 'vulture',
        role: 'reaper',
        archetype: 'assassin',
        epithet: 'Rendering Knife',
        stats: {
            hp: 560,
            atk: 70,
            atkSpeed: 0.9,
            armor: 18,
            range: 1,
            manaMax: 50,
            manaStart: 0,
        },
        ability: {
            name: 'Render Down',
            description:
                'Carves everything within 1 hex for 230% AD. Enemies left below 10% HP (threshold scales with AP) are executed.',
            kind: 'reap',
            power: { adRatio: 2.3 },
            aux: 0.1,
        },
    },
    {
        id: 'brownout',
        name: 'Brownout',
        cost: 2,
        manufacturer: 'surgecore',
        role: 'bombardier',
        archetype: 'caster',
        epithet: 'Grid Sagger',
        stats: {
            hp: 520,
            atk: 46,
            atkSpeed: 0.6,
            armor: 15,
            range: 4,
            manaMax: 70,
            manaStart: 0,
        },
        ability: {
            name: 'Voltage Sag',
            description:
                'Detonates a 1-hex blast on its target for 170 (scales with AP), burning 20 mana from everything it hits.',
            kind: 'blast',
            power: { base: 170, apScaled: true },
            aux: 1,
            aux2: 20,
        },
    },

    // ── Cost 3 ────────────────────────────────────────────────────────────
    {
        id: 'bastille',
        name: 'Bastille',
        cost: 3,
        manufacturer: 'blastworks',
        role: 'turret',
        archetype: 'specialist',
        epithet: 'Siege Configuration',
        stats: {
            hp: 780,
            atk: 62,
            atkSpeed: 0.8,
            armor: 32,
            range: 3,
            manaMax: 100,
            manaStart: 10,
        },
        ability: {
            name: 'Lockdown Protocol',
            description:
                'Locks into turret configuration for 4s, raking fire across the arena column by column for 35 plus 55% AD (scales with AP) per hit.',
            kind: 'sweep',
            power: { base: 35, adRatio: 0.55, apScaled: true },
            aux: 4,
        },
    },
    {
        id: 'vantage',
        name: 'Vantage',
        cost: 3,
        manufacturer: 'blacksite',
        role: 'turret',
        archetype: 'marksman',
        epithet: 'Patient Optic',
        stats: {
            hp: 580,
            atk: 78,
            atkSpeed: 1.05,
            armor: 15,
            range: 5,
            manaMax: 90,
            manaStart: 0,
        },
        ability: {
            name: 'Charged Shot',
            description:
                'Snipes the farthest enemy for 360% AD (+8% per hex of distance), piercing everything along the line.',
            kind: 'snipe',
            power: { adRatio: 3.6 },
        },
    },
    {
        id: 'pulsar',
        name: 'Pulsar',
        cost: 3,
        manufacturer: 'redline',
        role: 'amplifier',
        archetype: 'support',
        epithet: 'Beat Engine',
        stats: {
            hp: 680,
            atk: 55,
            atkSpeed: 0.75,
            armor: 25,
            range: 3,
            manaMax: 85,
            manaStart: 10,
        },
        ability: {
            name: 'Crossfade',
            description:
                'Drops the beat for 3s: allies within 2 hexes gain +25% attack speed (scales with AP), enemies in range lose 15%.',
            kind: 'aura',
            power: { base: 3 },
            aux: 0.25,
            aux2: 0.15,
        },
    },
    {
        id: 'gaffhook',
        name: 'Gaffhook',
        cost: 3,
        manufacturer: 'blastworks',
        role: 'bulwark',
        archetype: 'tank',
        epithet: 'Wreck Salvor',
        stats: {
            hp: 950,
            atk: 60,
            atkSpeed: 0.55,
            armor: 50,
            range: 1,
            manaMax: 80,
            manaStart: 20,
        },
        ability: {
            name: 'Drag Chain',
            description:
                'Hooks the farthest enemy, drags it adjacent, and blasts it for 80 plus 180% AD.',
            kind: 'hook',
            power: { base: 80, adRatio: 1.8 },
        },
    },
    {
        id: 'loom',
        name: 'Loom',
        cost: 3,
        manufacturer: 'hardlight',
        role: 'amplifier',
        archetype: 'support',
        epithet: 'Thread Oracle',
        stats: {
            hp: 620,
            atk: 52,
            atkSpeed: 0.7,
            armor: 18,
            range: 3,
            manaMax: 80,
            manaStart: 0,
        },
        ability: {
            name: 'Phase Weave',
            description:
                'Cleanses the 2 lowest-HP allies of debuffs and restores 220 HP (scales with AP) to each.',
            kind: 'cleanse',
            power: { base: 220, apScaled: true },
            aux: 2,
        },
    },
    {
        id: 'cinder',
        name: 'Cinder',
        cost: 3,
        manufacturer: 'blastworks',
        role: 'flanker',
        archetype: 'fighter',
        epithet: 'Backdraft Frame',
        stats: {
            hp: 760,
            atk: 70,
            atkSpeed: 0.9,
            armor: 30,
            range: 1,
            manaMax: 60,
            manaStart: 0,
        },
        ability: {
            name: 'Backdraft',
            description:
                'Ignites everything within 1 hex for 40 plus 155% AD, leaving a burn for 45/s (scales with AP) over 3s.',
            kind: 'scorch',
            power: { base: 40, adRatio: 1.55 },
            secondary: { base: 45, apScaled: true },
            aux: 1,
        },
    },
    {
        id: 'carrion',
        name: 'Carrion',
        cost: 3,
        manufacturer: 'vulture',
        role: 'breaker',
        archetype: 'fighter',
        epithet: 'Wreck Stripper',
        stats: {
            hp: 800,
            atk: 68,
            atkSpeed: 0.9,
            armor: 32,
            range: 1,
            manaMax: 60,
            manaStart: 0,
        },
        ability: {
            name: 'Strip Cyclone',
            description:
                'Whirls shredder blades within 1 hex for 250% AD, healing itself for 40% of the damage dealt.',
            kind: 'nova',
            power: { adRatio: 2.5 },
            aux: 1,
            aux2: 0.4,
        },
    },
    {
        id: 'dynamo',
        name: 'Dynamo',
        cost: 3,
        manufacturer: 'surgecore',
        role: 'juggernaut',
        archetype: 'tank',
        epithet: 'Flywheel Heart',
        stats: {
            hp: 920,
            atk: 55,
            atkSpeed: 0.6,
            armor: 48,
            range: 1,
            manaMax: 80,
            manaStart: 15,
        },
        ability: {
            name: 'Flywheel Slam',
            description:
                'Vents its flywheel in a 1-hex shockwave: 120 damage plus 250% of its armor, scaled by AP.',
            kind: 'shockwave',
            power: { base: 120, armorRatio: 2.5, apScaled: true },
        },
    },
    {
        id: 'roost',
        name: 'Roost',
        cost: 3,
        manufacturer: 'vulture',
        role: 'amplifier',
        archetype: 'support',
        epithet: 'Omen Perch',
        stats: {
            hp: 640,
            atk: 50,
            atkSpeed: 0.7,
            armor: 20,
            range: 3,
            manaMax: 80,
            manaStart: 0,
        },
        ability: {
            name: 'Death Omen',
            description:
                'Marks the highest-ATK enemy for 4s: it takes +20% damage, and allies striking it heal 40 HP (scales with AP).',
            kind: 'mark',
            power: { base: 4 },
            secondary: { base: 40, apScaled: true },
            aux: 0.2,
        },
    },
    {
        id: 'lantern',
        name: 'Lantern',
        cost: 3,
        manufacturer: 'hardlight',
        role: 'turret',
        archetype: 'tank',
        epithet: 'Anchored Beacon',
        stats: {
            hp: 950,
            atk: 50,
            atkSpeed: 0.6,
            armor: 48,
            range: 2,
            manaMax: 85,
            manaStart: 20,
        },
        ability: {
            name: 'Beacon Wall',
            description:
                'Projects a hardlight lattice: shields itself and adjacent allies for 110 plus 11.5% of its max HP, scaled by AP.',
            kind: 'phalanx',
            power: { base: 110, hpRatio: 0.115, apScaled: true },
        },
    },

    // ── Cost 4 ────────────────────────────────────────────────────────────
    {
        id: 'gravitas',
        name: 'Gravitas',
        cost: 4,
        manufacturer: 'hardlight',
        role: 'bulwark',
        archetype: 'tank',
        epithet: 'Mass Sculptor',
        stats: {
            hp: 1200,
            atk: 65,
            atkSpeed: 0.55,
            armor: 60,
            range: 1,
            manaMax: 100,
            manaStart: 25,
        },
        ability: {
            name: 'Well',
            description:
                'Collapses space within 2 hexes, dragging enemies adjacent and crushing them for 100 plus 12% of its max HP, scaled by AP.',
            kind: 'well',
            power: { base: 100, hpRatio: 0.12, apScaled: true },
            aux: 2,
        },
    },
    {
        id: 'nocturne',
        name: 'Nocturne',
        cost: 4,
        manufacturer: 'blacksite',
        role: 'flanker',
        archetype: 'assassin',
        epithet: 'Terminal Whisper',
        stats: {
            hp: 780,
            atk: 105,
            atkSpeed: 0.95,
            armor: 22,
            range: 1,
            manaMax: 70,
            manaStart: 10,
        },
        ability: {
            name: 'Harvest',
            description:
                'Shreds everything within 1 hex for 240% AD. Enemies left below 20% HP (threshold scales with AP) are executed.',
            kind: 'reap',
            power: { adRatio: 2.4 },
            aux: 0.2,
        },
    },
    {
        id: 'lifeline',
        name: 'Lifeline',
        cost: 4,
        manufacturer: 'aegisline',
        role: 'medic',
        archetype: 'support',
        epithet: 'Combat Anesthetist',
        stats: {
            hp: 800,
            atk: 58,
            atkSpeed: 0.7,
            armor: 28,
            range: 4,
            manaMax: 95,
            manaStart: 15,
        },
        ability: {
            name: 'Nano Surge',
            description:
                'Restores 340 HP (scales with AP) to the strongest ally and boosts its damage 40% for 5s.',
            kind: 'empower',
            power: { base: 340, apScaled: true },
            aux: 0.4,
        },
    },
    {
        id: 'warhead',
        name: 'Warhead',
        cost: 4,
        manufacturer: 'blastworks',
        role: 'bombardier',
        archetype: 'caster',
        epithet: 'Payload Sprinter',
        stats: {
            hp: 750,
            atk: 60,
            atkSpeed: 0.6,
            armor: 22,
            range: 4,
            manaMax: 90,
            manaStart: 10,
        },
        ability: {
            name: 'Micro-Missile Rack',
            description:
                'Launches 5 missiles at random enemies for 135 damage each (scales with AP), splashing adjacent hexes. The final missile deals double.',
            kind: 'barrage',
            power: { base: 135, apScaled: true },
            aux: 5,
        },
    },
    {
        id: 'gorge',
        name: 'Gorge',
        cost: 4,
        manufacturer: 'vulture',
        role: 'juggernaut',
        archetype: 'fighter',
        epithet: 'Compactor Maw',
        stats: {
            hp: 1050,
            atk: 90,
            atkSpeed: 0.8,
            armor: 40,
            range: 1,
            manaMax: 75,
            manaStart: 10,
        },
        ability: {
            name: 'Compact',
            description:
                'Bites its target for 200% AD plus 13% of its max HP, healing for all damage dealt. Kills permanently grant +100 max HP (scales with AP).',
            kind: 'devour',
            power: { adRatio: 2, hpRatio: 0.13 },
            secondary: { base: 100, apScaled: true },
            aux: 1,
        },
    },
    {
        id: 'kilovolt',
        name: 'Kilovolt',
        cost: 4,
        manufacturer: 'surgecore',
        role: 'breaker',
        archetype: 'fighter',
        epithet: 'Storm Fist',
        stats: {
            hp: 950,
            atk: 95,
            atkSpeed: 0.85,
            armor: 35,
            range: 1,
            manaMax: 70,
            manaStart: 0,
        },
        ability: {
            name: 'Storm Gauntlet',
            description:
                'Electrifies its fists for 4s: attacks deal +40 damage (scales with AP) and cleave a second adjacent enemy at 60%.',
            kind: 'gauntlet',
            power: { base: 40, apScaled: true },
            aux: 4,
        },
    },
    {
        id: 'sledge',
        name: 'Sledge',
        cost: 4,
        manufacturer: 'aegisline',
        role: 'breaker',
        archetype: 'tank',
        epithet: 'Breach Ram',
        stats: {
            hp: 1150,
            atk: 75,
            atkSpeed: 0.6,
            armor: 55,
            range: 1,
            manaMax: 90,
            manaStart: 20,
        },
        ability: {
            name: 'Doorbreaker',
            description:
                'Drives its ram through the target: 100 plus 330% armor damage along the line, knocking enemies back and stunning them for 1s.',
            kind: 'ram',
            power: { base: 100, armorRatio: 3.3 },
            aux2: 1,
        },
    },
    {
        id: 'arclight',
        name: 'Arclight',
        cost: 4,
        manufacturer: 'surgecore',
        role: 'reaper',
        archetype: 'marksman',
        epithet: 'Executioner Rail',
        stats: {
            hp: 720,
            atk: 100,
            atkSpeed: 1.1,
            armor: 18,
            range: 4,
            manaMax: 85,
            manaStart: 0,
        },
        ability: {
            name: 'Sentence',
            description:
                'Rails the lowest-HP enemy for 380% AD. If it dies, Sentence instantly recasts (up to 2 extra shots).',
            kind: 'guillotine',
            power: { adRatio: 3.8 },
            aux: 2,
        },
    },

    // ── Cost 5: Primes ────────────────────────────────────────────────────
    {
        id: 'meridian',
        name: 'Meridian',
        cost: 5,
        prime: 'iris',
        archetype: 'support',
        epithet: 'Prime of Clarity',
        stats: {
            hp: 1050,
            atk: 95,
            atkSpeed: 0.75,
            armor: 35,
            range: 3,
            manaMax: 110,
            manaStart: 20,
        },
        ability: {
            name: 'Transcendence',
            description:
                'For 3s, allies cannot drop below 1 HP and regenerate 80 HP per second (scales with AP).',
            kind: 'transcend',
            power: { base: 80, apScaled: true },
            aux: 3,
        },
    },
    {
        id: 'blackout',
        name: 'Blackout',
        cost: 5,
        prime: 'zero-day',
        archetype: 'caster',
        epithet: 'Prime of Silence',
        stats: {
            hp: 1000,
            atk: 95,
            atkSpeed: 0.7,
            armor: 30,
            range: 3,
            manaMax: 120,
            manaStart: 30,
        },
        ability: {
            name: 'EMP',
            description:
                'Detonates an EMP: every enemy loses all mana, is silenced for 4s, and takes 20% of its current HP (scales with AP, up to 35%).',
            kind: 'emp',
            power: { base: 0.2 },
            aux: 4,
        },
    },
    {
        id: 'citadel',
        name: 'Citadel',
        cost: 5,
        prime: 'emplacement',
        archetype: 'tank',
        epithet: 'Prime of Ground Held',
        stats: {
            hp: 1450,
            atk: 80,
            atkSpeed: 0.6,
            armor: 65,
            range: 2,
            manaMax: 120,
            manaStart: 20,
        },
        ability: {
            name: 'Terminal Defense',
            description:
                'Opens every port for 5s, raking fire across the arena column by column for 55 plus 55% of its armor (scales with AP) per hit.',
            kind: 'sweep',
            power: { base: 55, armorRatio: 0.55, apScaled: true },
            aux: 5,
        },
    },
    {
        id: 'valkyr',
        name: 'Valkyr',
        cost: 5,
        prime: 'guardian-protocol',
        archetype: 'support',
        epithet: 'Prime of the Watch',
        stats: {
            hp: 1100,
            atk: 85,
            atkSpeed: 0.75,
            armor: 40,
            range: 4,
            manaMax: 110,
            manaStart: 20,
        },
        ability: {
            name: 'Valkyrie',
            description:
                'Restores 250 HP (scales with AP) to every ally and boosts their damage 30% for 4s.',
            kind: 'valkyrie',
            power: { base: 250, apScaled: true },
            aux: 0.3,
        },
    },
    {
        id: 'facsimile',
        name: 'Facsimile',
        cost: 5,
        prime: 'adaptive-core',
        archetype: 'specialist',
        epithet: 'Prime of Mirrors',
        stats: {
            hp: 1150,
            atk: 100,
            atkSpeed: 0.8,
            armor: 40,
            range: 2,
            manaMax: 100,
            manaStart: 20,
        },
        ability: {
            name: 'Overclone',
            description:
                "Casts its copied unit's ability at 150% effectiveness.",
            kind: 'mimic',
            power: { base: 1.5 },
        },
    },
    {
        id: 'kensei',
        name: 'Kensei',
        cost: 5,
        prime: 'bladeform',
        archetype: 'assassin',
        epithet: 'Prime of the Drawn Blade',
        stats: {
            hp: 1050,
            atk: 110,
            atkSpeed: 0.85,
            armor: 30,
            range: 1,
            manaMax: 90,
            manaStart: 15,
        },
        ability: {
            name: 'Iaijutsu',
            description:
                'Dashes through the farthest enemy, slashing everything along its path for 290% AD.',
            kind: 'rush',
            power: { adRatio: 2.9 },
        },
    },

    // ── Tokens ────────────────────────────────────────────────────────────
    {
        id: 'sentry',
        name: 'Sentry',
        cost: 1,
        manufacturer: 'blastworks',
        role: 'turret',
        archetype: 'marksman',
        epithet: 'Bolted Gun',
        token: true,
        stats: {
            hp: 150,
            atk: 30,
            atkSpeed: 1.1,
            armor: 15,
            range: 2,
            manaMax: 999,
            manaStart: 0,
        },
        ability: {
            name: 'Rivet Stream',
            description: 'Just keeps shooting.',
            kind: 'strike',
            power: { base: 0 },
        },
    },

    // ── Enemy-only: scrap fodder ──────────────────────────────────────────
    // The opening floors field these instead of player-roster constructs.
    // They carry no traits, never cast (mana never fills), and exist so the
    // early game can be tuned without touching player-unit balance.
    {
        id: 'scrap',
        name: 'Scrap',
        cost: 1,
        archetype: 'fighter',
        epithet: 'Salvage Walker',
        enemyOnly: true,
        stats: {
            hp: 380,
            atk: 30,
            atkSpeed: 0.6,
            armor: 8,
            range: 1,
            manaMax: 999,
            manaStart: 0,
        },
        ability: {
            name: 'None',
            description: 'Just scrap and bad intentions.',
            kind: 'strike',
            power: { base: 0 },
        },
    },
    {
        id: 'stinger',
        name: 'Stinger',
        cost: 1,
        archetype: 'marksman',
        epithet: 'Salvage Wasp',
        enemyOnly: true,
        stats: {
            hp: 300,
            atk: 26,
            atkSpeed: 0.8,
            armor: 5,
            range: 3,
            manaMax: 999,
            manaStart: 0,
        },
        ability: {
            name: 'None',
            description: 'Pings away from a distance.',
            kind: 'strike',
            power: { base: 0 },
        },
    },
    {
        id: 'husk',
        name: 'Husk',
        cost: 2,
        archetype: 'tank',
        epithet: 'Salvage Hulk',
        enemyOnly: true,
        stats: {
            hp: 750,
            atk: 34,
            atkSpeed: 0.5,
            armor: 25,
            range: 1,
            manaMax: 999,
            manaStart: 0,
        },
        ability: {
            name: 'None',
            description: 'Too heavy to fall over.',
            kind: 'strike',
            power: { base: 0 },
        },
    },

    // ── Enemy-only: Act Guardian ──────────────────────────────────────────
    {
        id: 'axiom',
        name: 'Axiom',
        cost: 5,
        manufacturer: 'aegisline',
        role: 'bulwark',
        archetype: 'tank',
        epithet: 'Act Guardian',
        enemyOnly: true,
        stats: {
            hp: 4200,
            atk: 130,
            atkSpeed: 0.6,
            armor: 60,
            range: 2,
            manaMax: 110,
            manaStart: 20,
        },
        ability: {
            name: 'Axiomatic Judgement',
            description:
                'Detonates a 2-hex nova for 380 damage (scales with AP).',
            kind: 'nova',
            power: { base: 380, apScaled: true },
            aux: 2,
        },
    },
];

/** Lookup of unit definitions by id. */
export const UNIT_BY_ID: ReadonlyMap<string, UnitDef> = new Map(
    UNITS.map((u) => [u.id, u]),
);

/** Shop-eligible roster (excludes enemy-only constructs and tokens). */
export const SHOP_UNITS: UnitDef[] = UNITS.filter(
    (u) => !u.enemyOnly && !u.token,
);

/**
 * True when a unit is a Prime construct (unique trait, no manufacturer or
 * role).
 *
 * @param def - Unit definition.
 * @returns Whether the unit is a Prime.
 *
 * @example
 * isPrime(UNIT_BY_ID.get('meridian')!); // true
 */
export function isPrime(def: UnitDef): boolean {
    return def.prime !== undefined;
}

/** Multiplier applied to hp/atk/ability power per star above 1. */
export const STAR_MULTIPLIER = 1.8;

/**
 * Scales a base value for a star level (1-3).
 *
 * @param base - The 1-star value.
 * @param star - Star level.
 * @returns Scaled value.
 *
 * @example
 * starScale(100, 2); // 180
 */
export function starScale(base: number, star: number): number {
    return Math.round(base * Math.pow(STAR_MULTIPLIER, star - 1));
}
