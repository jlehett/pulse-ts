export type PrismClass = 'shard' | 'ward' | 'lens';
export type GeometryShape = 'octahedron' | 'cube' | 'icosahedron';

export interface AbilityDef {
    name: string;
    cooldown: number;
}

export interface ClassDef {
    id: PrismClass;
    name: string;
    shape: GeometryShape;
    radius: number;
    moveSpeed: number;
    maxHealth: number;
    primaryFireRate: number;
    primaryDamage: number;
    projectileSpeed: number;
    ability1: AbilityDef;
    ability2: AbilityDef;
}

export const CLASS_SHARD: ClassDef = {
    id: 'shard',
    name: 'Shard',
    shape: 'octahedron',
    radius: 0.5,
    moveSpeed: 4.5,
    maxHealth: 80,
    primaryFireRate: 8,
    primaryDamage: 10,
    projectileSpeed: 18,
    ability1: { name: 'Piercing Beam', cooldown: 5 },
    ability2: { name: 'Photon Dash', cooldown: 8 },
};

export const CLASS_WARD: ClassDef = {
    id: 'ward',
    name: 'Ward',
    shape: 'cube',
    radius: 0.6,
    moveSpeed: 3.5,
    maxHealth: 140,
    primaryFireRate: 4,
    primaryDamage: 15,
    projectileSpeed: 12,
    ability1: { name: 'Light Barrier', cooldown: 10 },
    ability2: { name: 'Sanctuary', cooldown: 14 },
};

export const CLASS_LENS: ClassDef = {
    id: 'lens',
    name: 'Lens',
    shape: 'icosahedron',
    radius: 0.55,
    moveSpeed: 3.8,
    maxHealth: 100,
    primaryFireRate: 2,
    primaryDamage: 35,
    projectileSpeed: 22,
    ability1: { name: 'Prism Split', cooldown: 7 },
    ability2: { name: 'Slow Field', cooldown: 12 },
};

export const ALL_CLASSES: ClassDef[] = [CLASS_SHARD, CLASS_WARD, CLASS_LENS];

export const PLAYER_COLORS = [0x00ccff, 0xff00ff, 0xffcc00, 0x00ff88];
