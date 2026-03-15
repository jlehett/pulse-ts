import {
    useFrameUpdate,
    useContext,
    useWorld,
    useStore,
} from '@pulse-ts/core';
import { useThreeContext } from '@pulse-ts/three';
import {
    useParticleBurst,
    useClearParticles,
    ParticlesService,
} from '@pulse-ts/effects';
import { useSound } from '@pulse-ts/audio';
import { GameCtx } from '../contexts';
import {
    ReplayStore,
    advanceReplay,
    getReplayPosition,
    getReplayVelocity,
    getReplaySpeed,
} from '../replay';
import { PLAYER_COLORS, TRAIL_BASE_INTERVAL } from '../config/arena';
import { triggerCameraShake } from './CameraRigNode';
import { useShockwavePool, worldToScreen } from '../shockwave';
import { useHitImpactPool } from '../hitImpact';

/**
 * Drives replay playback and VFX (particles, camera shake, sounds) during
 * the replay phase. DOM overlay concerns (letterbox, flash, labels) are
 * handled by {@link ReplayOverlayNode}.
 */
export function ReplayNode() {
    const gameState = useContext(GameCtx);
    const { camera } = useThreeContext();

    const [replay] = useStore(ReplayStore);
    const shockwavePool = useShockwavePool();
    const hitImpactPool = useHitImpactPool();

    // Hit impact burst — white particles at the collision point
    const hitImpactBurst = useParticleBurst({
        count: 16,
        lifetime: 0.4,
        color: 0xffffff,
        speed: [1, 3],
        gravity: 6,
        size: 0.3,
        blending: 'additive',
    });

    // Velocity-proportional trail bursts — one per player
    const p0Color = gameState.playerHexColors?.[0] ?? PLAYER_COLORS[0];
    const p1Color = gameState.playerHexColors?.[1] ?? PLAYER_COLORS[1];
    const trailBurst0 = useParticleBurst({
        count: 8,
        lifetime: 1.0,
        color: p0Color,
        speed: [0.2, 0.8],
        gravity: 1,
        size: 0.4,
        blending: 'additive',
        shrink: true,
    });
    const trailBurst1 = useParticleBurst({
        count: 8,
        lifetime: 1.0,
        color: p1Color,
        speed: [0.2, 0.8],
        gravity: 1,
        size: 0.4,
        blending: 'additive',
        shrink: true,
    });
    const trailBursts = [trailBurst0, trailBurst1];

    // Impact sound — matches the live collision sound from LocalPlayerNode
    const impactSfx = useSound('tone', {
        wave: 'square',
        frequency: [300, 100],
        duration: 0.1,
        gain: 0.15,
    });

    // Scale particle time to match replay speed (slow-motion)
    const world = useWorld();
    const particleService = world.getService(ParticlesService);

    // Clear lingering gameplay particles when entering replay
    const clearParticles = useClearParticles();

    // Transition state
    let wasReplay = false;
    let trailAccum = 0;
    const hitBurstsEmitted = new Set<number>();

    useFrameUpdate((dt) => {
        const isReplay = gameState.phase === 'replay' && replay.active;

        // Detect transition into replay — clear lingering particles
        if (isReplay && !wasReplay) {
            clearParticles();
        }
        wasReplay = isReplay;

        // Scale particle aging to match replay speed
        if (particleService) {
            particleService.timeScale = isReplay ? getReplaySpeed(replay) : 1;
        }

        // Drive replay playback
        if (isReplay) {
            advanceReplay(replay, dt);

            // Hit impact bursts + camera shake at each collision moment
            const cursor = replay.cursorPos;
            for (const hitIdx of replay.hitIndices) {
                if (hitBurstsEmitted.has(hitIdx)) continue;
                // Fire when cursor is within 1 frame of the hit
                if (Math.abs(cursor - hitIdx) < 1) {
                    const p0 = getReplayPosition(replay, 0);
                    const p1 = getReplayPosition(replay, 1);
                    if (p0 && p1) {
                        const mx = (p0[0] + p1[0]) / 2;
                        const my = (p0[1] + p1[1]) / 2;
                        const mz = (p0[2] + p1[2]) / 2;
                        hitImpactBurst([mx, my, mz]);
                        triggerCameraShake(0.4, 0.3);
                        const [su, sv] = worldToScreen(mx, my, mz, camera);
                        shockwavePool.trigger({ centerX: su, centerY: sv });
                        hitImpactPool.trigger({ worldX: mx, worldZ: mz });
                        impactSfx.play();
                    }
                    hitBurstsEmitted.add(hitIdx);
                }
            }

            // Velocity-proportional trail particles
            trailAccum += dt;
            const speed = getReplaySpeed(replay);
            const trailInterval =
                speed > 0 ? TRAIL_BASE_INTERVAL / speed : TRAIL_BASE_INTERVAL;
            if (trailAccum >= trailInterval) {
                trailAccum = 0;
                for (let pid = 0; pid < 2; pid++) {
                    const vel = getReplayVelocity(replay, pid);
                    if (!vel) continue;
                    const vmag = Math.sqrt(vel[0] * vel[0] + vel[2] * vel[2]);
                    if (vmag > 0.1) {
                        const pos = getReplayPosition(replay, pid);
                        if (pos) {
                            trailBursts[pid](pos);
                        }
                    }
                }
            }
        } else {
            trailAccum = 0;
            hitBurstsEmitted.clear();
        }
    });
}
