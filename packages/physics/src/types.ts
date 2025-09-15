import type { Vec3 } from '@pulse-ts/core';

export type RigidBodyType = 'dynamic' | 'kinematic' | 'static';

export interface PhysicsOptions {
    gravity?: { x: number; y: number; z: number } | Vec3;
    iterations?: number; // reserved for future constraint solving
    worldPlaneY?: number; // optional infinite ground plane at y
    cellSize?: number; // broadphase uniform grid cell size
}

export interface RaycastHit {
    node: any; // Node
    distance: number;
    point: { x: number; y: number; z: number };
    normal: { x: number; y: number; z: number };
}
