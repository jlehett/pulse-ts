import { useContext, useFrameUpdate, curlNoise2D } from '@pulse-ts/core';
import { useParticleBurst } from '@pulse-ts/effects';
import { ARENA_RADIUS } from '../../config/arena';
import { GameCtx, type RoundPhase } from '../../contexts';
import { getPlayerPosition } from '../../ai/playerPositions';
import { isMobile } from '@pulse-ts/platform';
import {
    useHitImpactPool,
    HIT_IMPACT_DURATION,
    HIT_SCATTER_RADIUS,
    HIT_SCATTER_STRENGTH,
} from '../../stores/hitImpact';

/** Total number of dust particles spawned each round. */
export const DUST_COUNT = 1500;

/** Deep blue energy color (matches platform's visual tone). */
export const DUST_COLOR = 0x0055bb;

/** Minimum initial speed (units/s). */
export const DUST_SPEED_MIN = 0.01;

/** Maximum initial speed (units/s). */
export const DUST_SPEED_MAX = 0.04;

/** Dust particle size. */
export const DUST_SIZE = 0.45;

/** Base opacity for dust within the arena. */
export const DUST_OPACITY = 0.3;

/** Base Y position for dust spawn volume. */
export const DUST_SPAWN_Y = 1.0;

/** XZ spread radius for dust spawn volume. */
export const DUST_SPREAD_XZ = 12;

/** Y spread for dust spawn volume. */
export const DUST_SPREAD_Y = 2;

/** Radius around players that pushes dust. */
export const DUST_PUSH_RADIUS = 1.8;

/** Maximum displacement distance at the player's center. */
export const DUST_PUSH_STRENGTH = 1.5;

/** Speed at which displacement ramps up when near a player (units/s lerp rate). */
export const DUST_DISP_ATTACK = 8;

/** Speed at which displacement fades back to zero after the player leaves. */
export const DUST_DISP_RELEASE = 2;

/** How quickly trail influence zones fade (per second). 1.0 = fully gone in ~1s. */
export const DUST_TRAIL_DECAY = 1.5;

/** Seconds between trail samples per player. */
const DUST_TRAIL_INTERVAL = 0.05;

/** Distance beyond ARENA_RADIUS at which dust is fully invisible. */
export const DUST_FADE_DISTANCE = 4;

/** Strength of counterclockwise orbital motion. */
export const DUST_ORBIT_STRENGTH = 3.0;

/** Strength of per-particle Perlin noise drift. */
export const DUST_NOISE_STRENGTH = 3.0;

/** Shimmer frequency in Hz — how fast each particle pulses. */
export const DUST_SHIMMER_FREQ = 1.0;

/** Minimum opacity multiplier during shimmer (0 = fully invisible at trough). */
export const DUST_SHIMMER_MIN = 0;

/** Peak opacity — lower overall for subtlety. */
export const DUST_SHIMMER_MAX_OPACITY = 0.4;

/** Maximum opacity multiplier added when particles are at full displacement. */
export const DUST_DISP_EMISSIVE_BOOST = 6.0;

/** Maximum size multiplier added when particles are at full displacement (1.0 = double size). */
export const DUST_DISP_SIZE_BOOST = 1.0;

/** Effectively infinite lifetime so dust persists until cleared. */
const DUST_LIFETIME = 999999;

/**
 * Atmospheric dust/ember particles that spawn once per round and persist
 * until the round resets. Particles gently swirl on their own and react
 * to nearby players, being pushed away by their movement.
 * Uses additive blending for a soft glow effect.
 *
 * Dust is locked to a flat plane (no Y movement) and fades out
 * beyond the arena border.
 *
 * Dust is cleared and re-spawned at replay start and round start.
 */
export function AtmosphericDustNode() {
    const gameState = useContext(GameCtx);
    const hitPool = useHitImpactPool();
    const mobile = isMobile();
    const dustCount = mobile ? Math.floor(DUST_COUNT / 2) : DUST_COUNT;

    // Influence zones: current players (strength=1) + fading trail positions.
    // Optional radius/pushStrength override defaults for hit impact scatter.
    const influences: {
        x: number;
        z: number;
        strength: number;
        radius?: number;
        pushStrength?: number;
    }[] = [];

    // Trail buffer — recent player positions that fade over time.
    const trail: { x: number; z: number; strength: number }[] = [];
    let trailTimer = 0;

    // When true, the next particle update zeros out displacement
    // so particles snap back to canonical positions.
    let resetDisplacement = false;

    const burst = useParticleBurst({
        count: dustCount,
        lifetime: DUST_LIFETIME,
        color: DUST_COLOR,
        speed: [DUST_SPEED_MIN, DUST_SPEED_MAX],
        gravity: 0,
        size: DUST_SIZE,
        blending: 'additive',
        opacity: DUST_OPACITY,
        shrink: false,
        init(p) {
            // Scatter in a circular disc within the arena
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.sqrt(Math.random()) * ARENA_RADIUS;
            const cx = Math.cos(angle) * radius;
            const cz = Math.sin(angle) * radius;
            p.position.set(
                cx,
                DUST_SPAWN_Y + Math.random() * DUST_SPREAD_Y,
                cz,
            );
            p.velocity.set(0, 0, 0);
            // Canonical XZ position — driven only by orbit + noise, never by players
            p.userData.canonX = cx;
            p.userData.canonZ = cz;
            // Current smoothed displacement from players
            p.userData.dispX = 0;
            p.userData.dispZ = 0;
            // Random shimmer phase so particles pulse independently
            p.userData.shimmerPhase = Math.random() * Math.PI * 2;
            // Random noise seed so each particle drifts uniquely
            p.userData.noiseSeed = Math.random() * 1000;
        },
        update(p, dt) {
            // Kill all velocity — motion is purely position-based
            p.velocity.set(0, 0, 0);

            // --- Update canonical position (orbit + curl noise) ---
            // Players never affect canonical position; it evolves independently.
            let cx = p.userData.canonX as number;
            let cz = p.userData.canonZ as number;

            // Orbit: rotate canonical position around center.
            // Angle scales with distance so edges orbit faster.
            const orbitDist = Math.sqrt(cx * cx + cz * cz) || 0.01;
            const edgeFactor = orbitDist / ARENA_RADIUS;
            const angle = DUST_ORBIT_STRENGTH * edgeFactor * dt * 0.1;
            const cosA = Math.cos(angle);
            const sinA = Math.sin(angle);
            const ox = cx;
            const oz = cz;
            cx = ox * cosA - oz * sinA;
            cz = ox * sinA + oz * cosA;

            // Curl noise drift (divergence-free, zero net drift)
            // Skipped on mobile — noise calls per particle per frame is expensive.
            if (!mobile) {
                const seed = p.userData.noiseSeed as number;
                const noiseScale = 0.3;
                const noiseTime = p.age * 0.1;
                const [curlX, curlZ] = curlNoise2D(
                    cx * noiseScale + seed,
                    cz * noiseScale + noiseTime,
                    { epsilon: 0.5 },
                );
                cx += curlX * DUST_NOISE_STRENGTH * dt;
                cz += curlZ * DUST_NOISE_STRENGTH * dt;
            }

            // Soft leash — keep canonical position within arena
            const leashDist = Math.sqrt(cx * cx + cz * cz);
            if (leashDist > ARENA_RADIUS) {
                const pullback = 1 - (ARENA_RADIUS / leashDist) * 0.02;
                cx *= pullback;
                cz *= pullback;
            }

            // Store updated canonical position
            p.userData.canonX = cx;
            p.userData.canonZ = cz;

            // Reset displacement on replay transitions
            if (resetDisplacement) {
                p.userData.dispX = 0;
                p.userData.dispZ = 0;
                p.position.x = cx;
                p.position.z = cz;
                return;
            }

            // --- Compute target displacement from players + trail ---
            // Each influence zone has a strength (1 = live player, <1 = fading trail).
            // Effective radius scales with strength so trail zones shrink as they fade.
            let targetDispX = 0;
            let targetDispZ = 0;
            let maxPush = 0;
            for (const inf of influences) {
                const baseRadius = inf.radius ?? DUST_PUSH_RADIUS;
                const basePush = inf.pushStrength ?? DUST_PUSH_STRENGTH;
                const effRadius = baseRadius * inf.strength;
                const dx = cx - inf.x;
                const dz = cz - inf.z;
                const distSq = dx * dx + dz * dz;
                if (distSq < effRadius * effRadius) {
                    const dist = Math.sqrt(distSq) || 0.001;
                    const nx = dx / dist;
                    const nz = dz / dist;
                    // Smoothstep falloff: strongest at center, fades to zero at edge
                    const t = dist / effRadius;
                    const falloff = 1 - t * t * (3 - 2 * t);
                    const push = falloff * basePush * inf.strength;
                    targetDispX += nx * push;
                    targetDispZ += nz * push;
                    if (basePush > maxPush) maxPush = basePush;
                }
            }

            // Clamp accumulated displacement to the strongest contributing
            // influence. Player-only stacking caps at DUST_PUSH_STRENGTH;
            // hit impacts raise the ceiling to HIT_SCATTER_STRENGTH.
            const clampMax = maxPush || DUST_PUSH_STRENGTH;
            let targetMag = Math.sqrt(
                targetDispX * targetDispX + targetDispZ * targetDispZ,
            );
            if (targetMag > clampMax) {
                const scale = clampMax / targetMag;
                targetDispX *= scale;
                targetDispZ *= scale;
                targetMag = clampMax;
            }

            // Asymmetric smoothing: fast attack (push out), slow release (drift back)
            let curDispX = p.userData.dispX as number;
            let curDispZ = p.userData.dispZ as number;
            const curMag = Math.sqrt(curDispX * curDispX + curDispZ * curDispZ);
            const rate =
                targetMag > curMag ? DUST_DISP_ATTACK : DUST_DISP_RELEASE;
            const lerpT = 1 - Math.exp(-rate * dt);
            curDispX += (targetDispX - curDispX) * lerpT;
            curDispZ += (targetDispZ - curDispZ) * lerpT;
            p.userData.dispX = curDispX;
            p.userData.dispZ = curDispZ;

            // Final rendered position = canonical + smoothed displacement
            p.position.x = cx + curDispX;
            p.position.z = cz + curDispZ;

            // Displacement-based emissive boost: brighter when pushed farther
            const dispMag = Math.sqrt(
                curDispX * curDispX + curDispZ * curDispZ,
            );
            // Only boost beyond normal player push range
            const dispNorm = Math.min(
                Math.max(
                    0,
                    (dispMag - DUST_PUSH_STRENGTH) /
                        (HIT_SCATTER_STRENGTH - DUST_PUSH_STRENGTH),
                ),
                1,
            );
            const dispBoost = 1 + dispNorm * DUST_DISP_EMISSIVE_BOOST;

            // Scale particle size up to double based on displacement
            p.size = DUST_SIZE * (1 + dispNorm * DUST_DISP_SIZE_BOOST);

            // Shimmer — per-particle pulsing using random phase offset
            const shimmerPhase = p.userData.shimmerPhase as number;
            const shimmerWave =
                0.5 +
                0.5 *
                    Math.sin(
                        p.age * DUST_SHIMMER_FREQ * Math.PI * 2 + shimmerPhase,
                    );

            // Distance-based intensity: full brightness at center, dimmer at edge
            const xzDist = Math.sqrt(
                p.position.x * p.position.x + p.position.z * p.position.z,
            );
            const centerFade = 1 - Math.min(1, xzDist / ARENA_RADIUS);
            const maxOpacity =
                DUST_SHIMMER_MIN +
                (DUST_SHIMMER_MAX_OPACITY - DUST_SHIMMER_MIN) * centerFade;
            const shimmerOpacity =
                DUST_SHIMMER_MIN +
                (maxOpacity - DUST_SHIMMER_MIN) * shimmerWave;

            // Apply displacement emissive boost and fade out beyond arena border
            if (xzDist > ARENA_RADIUS) {
                const fadeT = Math.min(
                    1,
                    (xzDist - ARENA_RADIUS) / DUST_FADE_DISTANCE,
                );
                p.opacity = shimmerOpacity * dispBoost * (1 - fadeT);
            } else {
                p.opacity = shimmerOpacity * dispBoost;
            }
        },
    });

    let lastPhase: RoundPhase = gameState.phase;

    // Spawn initial dust immediately
    burst([0, 0, 0]);

    // Deferred respawn: when a phase transition occurs, wait one frame before
    // re-bursting so that other systems (e.g. ReplayNode) can clearParticles()
    // first without wiping our freshly spawned dust.
    let respawnDelay = 0;

    useFrameUpdate((dt) => {
        const phase = gameState.phase;

        // Only re-burst after entering replay — that's the only transition
        // where ReplayNode calls clearParticles() and wipes our dust.
        if (phase === 'replay' && lastPhase !== 'replay') {
            respawnDelay = 2; // wait 2 frames so ReplayNode's clear runs first
            resetDisplacement = true;
        }
        // Reset displacement when exiting replay so particles snap to canonical
        if (phase !== 'replay' && lastPhase === 'replay') {
            resetDisplacement = true;
        }
        if (phase !== lastPhase) {
            trail.length = 0;
        }
        lastPhase = phase;

        if (respawnDelay > 0) {
            respawnDelay--;
            if (respawnDelay === 0) {
                burst([0, 0, 0]);
            }
        }

        // Read current player positions from shared store
        const currentPlayers: { x: number; z: number }[] = [];
        for (let i = 0; i < 2; i++) {
            const [px, , pz] = getPlayerPosition(i);
            const xzDistSq = px * px + pz * pz;
            if (xzDistSq < ARENA_RADIUS * ARENA_RADIUS * 4) {
                currentPlayers.push({ x: px, z: pz });
            }
        }

        // Decay existing trail entries and remove fully faded ones
        for (let i = trail.length - 1; i >= 0; i--) {
            trail[i].strength -= DUST_TRAIL_DECAY * dt;
            if (trail[i].strength <= 0) {
                trail.splice(i, 1);
            }
        }

        // Sample current player positions into trail at fixed interval
        trailTimer += dt;
        if (trailTimer >= DUST_TRAIL_INTERVAL) {
            trailTimer = 0;
            for (const pos of currentPlayers) {
                trail.push({ x: pos.x, z: pos.z, strength: 1 });
            }
        }

        // Build combined influence list: live players + fading trail
        influences.length = 0;
        for (const pos of currentPlayers) {
            influences.push({ x: pos.x, z: pos.z, strength: 1 });
        }
        for (const t of trail) {
            influences.push(t);
        }

        // Append active hit impacts as high-radius scatter influences
        for (const slot of hitPool.active()) {
            // Smoothstep decay from 1→0 over HIT_IMPACT_DURATION
            const t = slot.age / HIT_IMPACT_DURATION;
            const strength = 1 - t * t * (3 - 2 * t);
            influences.push({
                x: slot.data.worldX,
                z: slot.data.worldZ,
                strength,
                radius: HIT_SCATTER_RADIUS,
                pushStrength: HIT_SCATTER_STRENGTH,
            });
        }

        // Clear reset flag after particles have been processed this frame
        resetDisplacement = false;
    });
}
