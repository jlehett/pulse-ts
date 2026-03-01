import { useComponent, Transform, useFrameUpdate } from '@pulse-ts/core';
import { useRigidBody, useBoxCollider } from '@pulse-ts/physics';
import { useMesh, useObject3D } from '@pulse-ts/three';
import { useAnimate } from '@pulse-ts/effects';
import * as THREE from 'three';
import { ARENA_RADIUS } from '../config/arena';

/** Radius of the arena cylinder (sourced from arena config). */
export const PLATFORM_RADIUS = ARENA_RADIUS;

/** Height (thickness) of the arena cylinder. */
export const PLATFORM_HEIGHT = 0.5;

/** Color of the platform surface. */
const PLATFORM_COLOR = 0x3a5a6a;

/** Color of the emissive edge ring. */
const RING_COLOR = 0x00ccff;

/**
 * Circular arena platform — a flat cylinder with a pulsing emissive torus
 * around its edge. Uses a box collider for the floor surface (no edge walls
 * so players can be knocked off).
 */
export function PlatformNode() {
    const transform = useComponent(Transform);
    transform.localPosition.set(0, 0, 0);

    // Physics — static box collider approximating the cylinder floor
    useRigidBody({ type: 'static' });
    useBoxCollider(PLATFORM_RADIUS, PLATFORM_HEIGHT / 2, PLATFORM_RADIUS, {
        friction: 0.6,
        restitution: 0,
    });

    // Visual — cylinder mesh for the platform surface
    useMesh('cylinder', {
        radius: PLATFORM_RADIUS,
        height: PLATFORM_HEIGHT,
        radialSegments: 48,
        color: PLATFORM_COLOR,
        roughness: 0.7,
        metalness: 0.2,
        receiveShadow: true,
    });

    // Decorative edge ring — torus sitting at the platform rim
    const ringGeometry = new THREE.TorusGeometry(PLATFORM_RADIUS, 0.08, 12, 64);
    const ringMaterial = new THREE.MeshStandardMaterial({
        color: RING_COLOR,
        emissive: RING_COLOR,
        emissiveIntensity: 0.6,
        roughness: 0.3,
        metalness: 0.5,
    });
    const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
    ringMesh.rotation.x = -Math.PI / 2; // lay flat
    ringMesh.position.y = PLATFORM_HEIGHT / 2; // sit on top edge
    useObject3D(ringMesh);

    // Pulsing glow on the ring
    const pulse = useAnimate({
        wave: 'sine',
        min: 0.3,
        max: 1.0,
        frequency: 1.5,
    });

    useFrameUpdate(() => {
        ringMaterial.emissiveIntensity = pulse.value;
    });
}
