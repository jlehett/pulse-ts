export type EnemyType = 'shard' | 'nullcube';

export interface EnemyDef {
    type: EnemyType;
    name: string;
    health: number;
    moveSpeed: number;
    contactDamage: number;
    /** Radius of the enemy mesh bounding sphere, used for collision. */
    radius: number;
    color: number;
    glowColor: number;
    /** Pulse speed multiplier — higher = faster flicker. */
    pulseSpeed: number;
    /** Pulse amplitude (0–1) — how much the glow varies. */
    pulseAmount: number;
}

export const ENEMY_SHARD: EnemyDef = {
    type: 'shard',
    name: 'Shard',
    health: 30,
    moveSpeed: 5.0,
    contactDamage: 8,
    radius: 0.4,
    color: 0x0a0410,
    glowColor: 0x9933bb,
    pulseSpeed: 8.0,
    pulseAmount: 0.4,
};

export const ENEMY_NULLCUBE: EnemyDef = {
    type: 'nullcube',
    name: 'Nullcube',
    health: 100,
    moveSpeed: 2.5,
    contactDamage: 15,
    radius: 0.7,
    color: 0x06030e,
    glowColor: 0x6622aa,
    pulseSpeed: 2.0,
    pulseAmount: 0.2,
};

export const ALL_ENEMIES: EnemyDef[] = [
    ENEMY_SHARD,
    ENEMY_NULLCUBE,
];
