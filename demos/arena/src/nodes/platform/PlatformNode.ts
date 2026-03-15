import { useComponent, Transform, useFrameUpdate, useStore } from '@pulse-ts/core';
import { useRigidBody, useCylinderCollider } from '@pulse-ts/physics';
import { useMesh, useCustomMesh } from '@pulse-ts/three';
import { useAnimate } from '@pulse-ts/effects';
import * as THREE from 'three';
import { ARENA_RADIUS } from '../../config/arena';
import { isMobile } from '@pulse-ts/platform';
import {
    useHitImpactPool,
    HIT_RIPPLE_MAX_RADIUS,
    HIT_RIPPLE_EXPAND_DURATION,
} from '../../stores/hitImpact';
import {
    createGridNormalMap,
    createGridEmissiveMap,
    createEnergyLineMap,
    createRingGlowMap,
    createWakeMap,
    GRID_MAP_SIZE,
    GRID_SPACING,
    GRID_LINE_WIDTH,
} from './textures';
import {
    rasterizeWake,
    worldToUV,
    WAKE_MAP_SIZE,
    WAKE_MAP_SIZE_MOBILE,
    WAKE_RADIUS,
    WAKE_MIN_DISTANCE,
    WAKE_TRAIL_INTERVAL,
    WAKE_TRAIL_DECAY,
    WAKE_MAX_TRAIL,
} from './wake';
import type { WakeTrailPoint } from './wake';
import { createPlatformShaderUniforms } from './shaderPatch';
import { applyPlatformShaderPatch } from './shaderPatch';
import { PlayerPositionStore, getPlayerPosition } from '../../ai/playerPositions';

// Re-export all public symbols so existing imports from './PlatformNode' continue to work
export {
    createGridNormalMap,
    createGridEmissiveMap,
    createEnergyLineMap,
    createRingGlowMap,
    createWakeMap,
} from './textures';
export {
    rasterizeWake,
    worldToUV,
    WAKE_MAP_SIZE,
    WAKE_MAP_SIZE_MOBILE,
    WAKE_DISPLACEMENT,
    WAKE_MIN_DISTANCE,
    WAKE_RADIUS,
    WAKE_THIN_START,
    WAKE_TRAIL_INTERVAL,
    WAKE_TRAIL_DECAY,
    WAKE_MAX_TRAIL,
} from './wake';
export type { WakeTrailPoint } from './wake';
export { RIPPLE_INTENSITY } from './shaderPatch';

/** Radius of the arena cylinder (sourced from arena config). */
export const PLATFORM_RADIUS = ARENA_RADIUS;

/** Height (thickness) of the arena cylinder. */
export const PLATFORM_HEIGHT = 0.5;

/** Color of the platform surface — dark space-purple with a cyan-blue tint. */
const PLATFORM_COLOR = 0x0a0c1a;

/** Color of the emissive edge ring. */
const RING_COLOR = 0x00ccff;

/** Clockwise rotation speed of the ring glow (revolutions per second). */
const RING_GLOW_SPEED = 0.15;

/** Number of ripple ring meshes in the pool. */
const RIPPLE_COUNT = 3;

/** Seconds between ripple spawns. */
export const RIPPLE_INTERVAL = 4;

/** How long each ripple takes to expand from center to edge (seconds). */
export const RIPPLE_DURATION = 2.5;

/**
 * Circular arena platform — a flat cylinder with a glowing grid surface,
 * flowing energy lines, and a pulsing emissive edge ring with outer glow.
 *
 * Uses a cylinder collider for accurate circular collision
 * (no edge walls so players can be knocked off).
 */
export function PlatformNode() {
    const hitPool = useHitImpactPool();
    const transform = useComponent(Transform);
    transform.localPosition.set(0, 0, 0);

    // Physics — static cylinder collider matching the visual cylinder
    useRigidBody({ type: 'static' });
    useCylinderCollider(PLATFORM_RADIUS, PLATFORM_HEIGHT / 2, {
        friction: 0.6,
        restitution: 0,
    });

    // Procedural texture maps
    const normalMap = createGridNormalMap();
    const gridEmissiveMap = createGridEmissiveMap(
        GRID_MAP_SIZE,
        GRID_SPACING / 2,
        GRID_LINE_WIDTH,
        true,
    );

    // Visual — cylinder mesh for the platform surface (opaque dark base)
    const { material: platformMat } = useMesh('cylinder', {
        radius: PLATFORM_RADIUS,
        height: PLATFORM_HEIGHT,
        radialSegments: 48,
        color: PLATFORM_COLOR,
        roughness: 0.7,
        metalness: 0.2,
        receiveShadow: true,
        normalMap,
        normalScale: [0.3, 0.3],
        emissive: RING_COLOR,
        emissiveMap: gridEmissiveMap,
        emissiveIntensity: 0.15,
    });

    // --- Blue tint fill on top of the grid ---
    const { object: fillMesh } = useCustomMesh({
        geometry: () =>
            new THREE.CylinderGeometry(
                PLATFORM_RADIUS,
                PLATFORM_RADIUS,
                0.01,
                48,
            ),
        material: () =>
            new THREE.MeshBasicMaterial({
                color: 0x2244aa,
                transparent: true,
                opacity: 0.035,
                depthWrite: false,
            }),
    });
    fillMesh.position.y = PLATFORM_HEIGHT / 2 + 0.01;

    // --- Energy line overlay ---
    const energyMap = createEnergyLineMap();
    const { object: energyMesh } = useCustomMesh({
        geometry: () =>
            new THREE.CylinderGeometry(
                PLATFORM_RADIUS - 0.1,
                PLATFORM_RADIUS - 0.1,
                0.02,
                48,
            ),
        material: () =>
            new THREE.MeshStandardMaterial({
                color: 0x000000,
                emissive: RING_COLOR,
                emissiveMap: energyMap,
                emissiveIntensity: 0.12,
                transparent: true,
                opacity: 0.15,
                roughness: 1,
                metalness: 0,
                depthWrite: false,
            }),
    });
    energyMesh.position.y = PLATFORM_HEIGHT / 2 + 0.02;

    // --- Enhanced edge ring (primary) with rotating glow ---
    const ringGlowMap = createRingGlowMap();
    const { object: ringMesh, material: ringMaterialBase } = useCustomMesh({
        geometry: () => new THREE.TorusGeometry(PLATFORM_RADIUS, 0.12, 12, 64),
        material: () =>
            new THREE.MeshStandardMaterial({
                color: 0x000000,
                emissive: RING_COLOR,
                emissiveMap: ringGlowMap,
                emissiveIntensity: 1.5,
                roughness: 0.3,
                metalness: 0.5,
            }),
    });
    const ringMaterial = ringMaterialBase as THREE.MeshStandardMaterial;
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = PLATFORM_HEIGHT / 2;

    // --- Outer glow ring (soft halo) with same rotating glow ---
    const glowGlowMap = createRingGlowMap();
    const { object: glowMesh, material: glowMaterialBase } = useCustomMesh({
        geometry: () => new THREE.TorusGeometry(PLATFORM_RADIUS, 0.3, 12, 64),
        material: () =>
            new THREE.MeshStandardMaterial({
                color: 0x000000,
                emissive: RING_COLOR,
                emissiveMap: glowGlowMap,
                emissiveIntensity: 0.6,
                transparent: true,
                opacity: 0.15,
                roughness: 0.5,
                metalness: 0.3,
                depthWrite: false,
            }),
    });
    const glowMaterial = glowMaterialBase as THREE.MeshStandardMaterial;
    glowMesh.rotation.x = -Math.PI / 2;
    glowMesh.position.y = PLATFORM_HEIGHT / 2;

    // --- Wake map (CPU-rasterized player trail influence) ---
    const mobile = isMobile();
    const wakeSize = mobile ? WAKE_MAP_SIZE_MOBILE : WAKE_MAP_SIZE;
    const wakeMap = createWakeMap(wakeSize);
    const wakeTrail: WakeTrailPoint[] = [];
    let wakeTrailTimer = 0;
    const lastPlayerPositions: Array<{ x: number; z: number }> = [];
    let wakeFrameSkip = 0;

    // --- Ripple + wake shader patch ---
    const shaderUniforms = createPlatformShaderUniforms(wakeMap);
    applyPlatformShaderPatch(
        platformMat as THREE.MeshStandardMaterial,
        shaderUniforms,
    );

    const rippleAges: number[] = new Array(RIPPLE_COUNT).fill(-1);
    let rippleTimer = 0;
    let nextRipple = 0;

    // Animation — pulsing glow on the ring
    const pulse = useAnimate({
        wave: 'sine',
        min: 0.4,
        max: 1.5,
        frequency: 1.5,
    });

    // Animation — energy line rotation
    const energySpin = useAnimate({ rate: 0.3 });

    // Animation — clockwise ring glow rotation
    const ringGlowSpin = useAnimate({ rate: RING_GLOW_SPEED });

    const [playerPositions] = useStore(PlayerPositionStore);

    useFrameUpdate((dt) => {
        // Sync hit ripple uniforms from active pool slots
        const hitRippleRadii = shaderUniforms.uHitRippleRadii.value;
        const hitRippleCenterX = shaderUniforms.uHitRippleCenterX.value;
        const hitRippleCenterY = shaderUniforms.uHitRippleCenterY.value;

        for (let i = 0; i < 4; i++) {
            hitRippleRadii.setComponent(i, -1);
        }
        let hitSlotIdx = 0;
        for (const slot of hitPool.active()) {
            if (hitSlotIdx >= 4) break;
            const [u, v] = worldToUV(
                slot.data.worldX,
                slot.data.worldZ,
                ARENA_RADIUS,
            );
            hitRippleCenterX.setComponent(hitSlotIdx, u);
            hitRippleCenterY.setComponent(hitSlotIdx, v);
            const progress = Math.min(slot.age / HIT_RIPPLE_EXPAND_DURATION, 1);
            hitRippleRadii.setComponent(
                hitSlotIdx,
                progress * HIT_RIPPLE_MAX_RADIUS,
            );
            hitSlotIdx++;
        }

        ringMaterial.emissiveIntensity = pulse.value;
        glowMaterial.emissiveIntensity = pulse.value * 0.4;

        // Rotate energy line overlay around Y axis
        energyMesh.rotation.y = energySpin.value;

        // Rotate ring glow clockwise by scrolling emissiveMap UV offset
        const glowOffset = -ringGlowSpin.value;
        ringGlowMap.offset.x = glowOffset;
        glowGlowMap.offset.x = glowOffset;

        // Spawn ripples periodically
        rippleTimer += dt;
        if (rippleTimer >= RIPPLE_INTERVAL) {
            rippleTimer = 0;
            rippleAges[nextRipple] = 0;
            nextRipple = (nextRipple + 1) % RIPPLE_COUNT;
        }

        // Update ripple uniforms
        const RIPPLE_OVERSHOOT = 1.45;
        const rippleRadii = shaderUniforms.uRippleRadii.value;
        for (let i = 0; i < RIPPLE_COUNT; i++) {
            if (rippleAges[i] < 0) continue;
            rippleAges[i] += dt;
            const t = rippleAges[i] / RIPPLE_DURATION;
            if (t >= RIPPLE_OVERSHOOT) {
                rippleAges[i] = -1;
                rippleRadii.setComponent(i, -1);
            } else {
                rippleRadii.setComponent(i, t);
            }
        }

        // --- Wake trail tracking ---
        const currentPlayers: { x: number; z: number }[] = [];
        for (let i = 0; i < 2; i++) {
            const [px, , pz] = getPlayerPosition(playerPositions, i);
            const xzDistSq = px * px + pz * pz;
            if (xzDistSq < ARENA_RADIUS * ARENA_RADIUS * 4) {
                currentPlayers.push({ x: px, z: pz });
            }
        }

        // Decay existing trail entries and remove fully faded ones
        for (let i = wakeTrail.length - 1; i >= 0; i--) {
            wakeTrail[i].strength -= WAKE_TRAIL_DECAY * dt;
            if (wakeTrail[i].strength <= 0) {
                wakeTrail.splice(i, 1);
            }
        }

        // Sample current player positions into trail at fixed interval
        wakeTrailTimer += dt;
        if (wakeTrailTimer >= WAKE_TRAIL_INTERVAL) {
            wakeTrailTimer = 0;
            for (let i = 0; i < currentPlayers.length; i++) {
                const pos = currentPlayers[i];
                const prev = lastPlayerPositions[i];
                if (prev) {
                    const mx = pos.x - prev.x;
                    const mz = pos.z - prev.z;
                    const moveDist = Math.sqrt(mx * mx + mz * mz);
                    if (moveDist > WAKE_MIN_DISTANCE) {
                        const inv = 1 / moveDist;
                        wakeTrail.push({
                            x: pos.x,
                            z: pos.z,
                            strength: 1,
                            dirX: mx * inv,
                            dirZ: mz * inv,
                        });
                        if (wakeTrail.length > WAKE_MAX_TRAIL) {
                            wakeTrail.shift();
                        }
                    }
                }
                lastPlayerPositions[i] = { x: pos.x, z: pos.z };
            }
            lastPlayerPositions.length = currentPlayers.length;
        }

        // Rasterize wake influence and flag texture for upload
        const shouldRasterize = !mobile || ++wakeFrameSkip % 2 === 0;
        if (shouldRasterize) {
            const wakeData = wakeMap.image.data as Uint8Array;
            rasterizeWake(
                wakeData,
                wakeSize,
                wakeTrail,
                ARENA_RADIUS,
                WAKE_RADIUS,
            );
            wakeMap.needsUpdate = true;
        }
    });
}
