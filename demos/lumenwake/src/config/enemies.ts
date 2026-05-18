export type EnemyType = 'shard' | 'nullcube' | 'eclipser';

export interface EnemyDef {
    type: EnemyType;
    name: string;
    health: number;
    moveSpeed: number;
    contactDamage: number;
    /** Radius of the enemy mesh bounding sphere, used for collision. */
    radius: number;
    color: number;
    emissiveColor: number;
}

export const ENEMY_SHARD: EnemyDef = {
    type: 'shard',
    name: 'Shard',
    health: 30,
    moveSpeed: 5.0,
    contactDamage: 8,
    radius: 0.4,
    color: 0x2a1040,
    emissiveColor: 0x8844cc,
};

export const ENEMY_NULLCUBE: EnemyDef = {
    type: 'nullcube',
    name: 'Nullcube',
    health: 100,
    moveSpeed: 2.5,
    contactDamage: 15,
    radius: 0.7,
    color: 0x2a2040,
    emissiveColor: 0x6655aa,
};

export const ENEMY_ECLIPSER: EnemyDef = {
    type: 'eclipser',
    name: 'Eclipser',
    health: 60,
    moveSpeed: 2.0,
    contactDamage: 10,
    radius: 0.6,
    color: 0x1a1030,
    emissiveColor: 0x553388,
};

export const ALL_ENEMIES: EnemyDef[] = [
    ENEMY_SHARD,
    ENEMY_NULLCUBE,
    ENEMY_ECLIPSER,
];
