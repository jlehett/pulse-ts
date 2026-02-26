import * as THREE from 'three';
import { useNode, useFrameUpdate, useDestroy } from '@pulse-ts/core';
import { useThreeRoot, useObject3D } from '@pulse-ts/three';

/** Number of particles in a single burst. */
export const PARTICLE_COUNT = 24;

/** Total lifetime of the burst effect in seconds. */
export const BURST_LIFETIME = 0.5;

/** Default particle color (gold). */
export const DEFAULT_PARTICLE_COLOR = 0xf4d03f;

/** Gravity pull applied to particles each frame (units/s²). */
const GRAVITY = 9.8;

/** Base outward speed range for initial velocities. */
const MIN_SPEED = 1.5;
const MAX_SPEED = 4.0;

export interface ParticleBurstNodeProps {
    position: [number, number, number];
    /** Particle color. Defaults to gold (`0xf4d03f`). */
    color?: number;
}

/**
 * Self-contained particle burst effect using `THREE.Points`.
 *
 * Spawns a fixed number of particles that fan outward with random velocities,
 * fade linearly to transparent, and self-destruct after the lifetime expires.
 *
 * @param props - World-space position and optional color for the burst.
 *
 * @example
 * ```ts
 * import { useWorld } from '@pulse-ts/core';
 * import { ParticleBurstNode } from './ParticleBurstNode';
 *
 * const world = useWorld();
 * // Gold burst (default)
 * world.mount(ParticleBurstNode, { position: [1, 2, 0] });
 * // Red burst
 * world.mount(ParticleBurstNode, { position: [1, 2, 0], color: 0xcc2200 });
 * ```
 */
export function ParticleBurstNode(props: Readonly<ParticleBurstNodeProps>) {
    const node = useNode();
    const root = useThreeRoot();
    root.position.set(...props.position);

    // Geometry: position buffer for each particle
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: props.color ?? DEFAULT_PARTICLE_COLOR,
        size: 0.08,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    useObject3D(points);

    // Random initial velocities for each particle
    const velocities: THREE.Vector3[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const speed = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
        velocities.push(
            new THREE.Vector3(
                Math.sin(phi) * Math.cos(theta) * speed,
                Math.sin(phi) * Math.sin(theta) * speed,
                Math.cos(phi) * speed,
            ),
        );
    }

    let elapsed = 0;

    useFrameUpdate((dt) => {
        elapsed += dt;

        if (elapsed >= BURST_LIFETIME) {
            node.destroy();
            return;
        }

        // Update positions and apply gravity
        const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            velocities[i].y -= GRAVITY * dt;

            const idx = i * 3;
            posAttr.array[idx] += velocities[i].x * dt;
            posAttr.array[idx + 1] += velocities[i].y * dt;
            posAttr.array[idx + 2] += velocities[i].z * dt;
        }
        posAttr.needsUpdate = true;

        // Fade opacity linearly
        material.opacity = 1 - elapsed / BURST_LIFETIME;
    });

    useDestroy(() => {
        geometry.dispose();
        material.dispose();
    });
}
