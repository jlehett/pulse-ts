import { useCustomMesh } from '@pulse-ts/three';
import { useAnimate } from '@pulse-ts/effects';
import { useFrameUpdate } from '@pulse-ts/core';
import * as THREE from 'three';
import { ARENA_RADIUS } from '../../config/arena';

/** Number of energy pillars around the perimeter. */
export const PILLAR_COUNT = 8;

/** Radius of each pillar cylinder. */
export const PILLAR_RADIUS = 0.15;

/** Height of each pillar. */
export const PILLAR_HEIGHT = 4;

/** Distance from arena center to pillar ring. */
export const PILLAR_ORBIT_RADIUS = ARENA_RADIUS + 2;

/** Pillar emissive color (cyan). */
export const PILLAR_COLOR = 0x00ccff;

/** Minimum emissive intensity during pulse. */
export const PILLAR_EMISSIVE_MIN = 0.4;

/** Maximum emissive intensity during pulse. */
export const PILLAR_EMISSIVE_MAX = 1.2;

/** Pulse frequency in Hz. */
export const PILLAR_PULSE_FREQ = 1.0;

/**
 * 8 glowing thin cylinders arranged in a ring around the arena perimeter.
 *
 * Each pillar pulses with a staggered sine phase offset, creating a
 * rhythmic energy-fence effect around the arena edge.
 */
export function EnergyPillarsNode() {
    const materials: THREE.MeshStandardMaterial[] = [];

    // Share geometry across all pillars via useCustomMesh for lifecycle management.
    // The first pillar's useCustomMesh creates and manages the group; remaining
    // pillars are added as children of the group.
    const sharedGeometry = new THREE.CylinderGeometry(
        PILLAR_RADIUS,
        PILLAR_RADIUS,
        PILLAR_HEIGHT,
        8,
    );

    const { object: group } = useCustomMesh({
        geometry: () => sharedGeometry,
        material: () => {
            const mat = new THREE.MeshStandardMaterial({
                color: 0x000000,
                emissive: PILLAR_COLOR,
                emissiveIntensity: 0.6,
                transparent: true,
                opacity: 0.8,
                roughness: 0.3,
                metalness: 0.6,
            });
            materials.push(mat);
            return mat;
        },
    });

    // Position the first pillar mesh
    const angle0 = 0;
    group.position.set(
        Math.cos(angle0) * PILLAR_ORBIT_RADIUS,
        PILLAR_HEIGHT / 2,
        Math.sin(angle0) * PILLAR_ORBIT_RADIUS,
    );

    // Create remaining pillars as siblings via additional useCustomMesh calls
    for (let i = 1; i < PILLAR_COUNT; i++) {
        const angle = (i / PILLAR_COUNT) * Math.PI * 2;
        const { object: pillarMesh, material: pillarMat } = useCustomMesh({
            geometry: () => sharedGeometry,
            material: () =>
                new THREE.MeshStandardMaterial({
                    color: 0x000000,
                    emissive: PILLAR_COLOR,
                    emissiveIntensity: 0.6,
                    transparent: true,
                    opacity: 0.8,
                    roughness: 0.3,
                    metalness: 0.6,
                }),
        });
        materials.push(pillarMat as THREE.MeshStandardMaterial);
        pillarMesh.position.set(
            Math.cos(angle) * PILLAR_ORBIT_RADIUS,
            PILLAR_HEIGHT / 2,
            Math.sin(angle) * PILLAR_ORBIT_RADIUS,
        );
    }

    const timer = useAnimate({ rate: PILLAR_PULSE_FREQ });

    useFrameUpdate(() => {
        const t = timer.value;
        for (let i = 0; i < materials.length; i++) {
            // Staggered phase offset per pillar
            const phase = (i / PILLAR_COUNT) * Math.PI * 2;
            const sine = Math.sin(t * Math.PI * 2 + phase);
            const range = PILLAR_EMISSIVE_MAX - PILLAR_EMISSIVE_MIN;
            materials[i].emissiveIntensity =
                PILLAR_EMISSIVE_MIN + (sine * 0.5 + 0.5) * range;
        }
    });
}
