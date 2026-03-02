import { useFrameUpdate, useDestroy, useContext } from '@pulse-ts/core';
import { useThreeContext } from '@pulse-ts/three';
import { useParticleBurst } from '@pulse-ts/effects';
import { GameCtx } from '../contexts';
import {
    advanceReplay,
    isReplayActive,
    getReplayPosition,
    getReplayVelocity,
    getReplaySpeed,
    getReplayHitProximity,
    hasReplayHit,
} from '../replay';
import {
    PLAYER_COLORS,
    TRAIL_VELOCITY_THRESHOLD,
    TRAIL_BASE_INTERVAL,
} from '../config/arena';

/** Height of each cinematic letterbox bar as a CSS value. */
export const LETTERBOX_HEIGHT = '8%';

/** Duration of the dark flash when entering/exiting replay (seconds). */
export const TRANSITION_FLASH_DURATION = 0.4;

/** Random messages displayed during a self-KO replay. */
export const SELF_KO_MESSAGES = [
    'Gravity wins!',
    '...really?',
    'Own goal!',
    'Unforced error',
    'Self-destruct!',
    'Whoops!',
    'Task failed successfully',
    'No one to blame',
];

/** Per-letter bob animation period in seconds. */
export const SELF_KO_BOB_PERIOD = 0.6;

/** Delay between each letter's bob start in seconds. */
export const SELF_KO_BOB_STAGGER = 0.05;

/** Vertical bob distance in pixels. */
export const SELF_KO_BOB_DISTANCE = 8;

/**
 * DOM overlay that displays cinematic letterboxing, a "REPLAY" label,
 * and a dark flash transition during the replay phase. Drives replay
 * playback by calling `advanceReplay(dt)` each frame. Also emits
 * dash trail particles when players are moving fast during replay.
 */
export function ReplayNode() {
    const gameState = useContext(GameCtx);
    const { renderer } = useThreeContext();
    const container = renderer.domElement.parentElement ?? document.body;

    // Dark flash overlay — masks the position jump entering/exiting replay
    const flash = document.createElement('div');
    Object.assign(flash.style, {
        position: 'absolute',
        inset: '0',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        zIndex: '2015',
        opacity: '0',
        pointerEvents: 'none',
    } as Partial<CSSStyleDeclaration>);
    container.appendChild(flash);

    // Top letterbox bar
    const topBar = document.createElement('div');
    Object.assign(topBar.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        height: LETTERBOX_HEIGHT,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        zIndex: '2010',
        transition: 'opacity 0.3s ease-in-out',
        opacity: '0',
        pointerEvents: 'none',
    } as Partial<CSSStyleDeclaration>);
    container.appendChild(topBar);

    // Bottom letterbox bar
    const bottomBar = document.createElement('div');
    Object.assign(bottomBar.style, {
        position: 'absolute',
        bottom: '0',
        left: '0',
        right: '0',
        height: LETTERBOX_HEIGHT,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        zIndex: '2010',
        transition: 'opacity 0.3s ease-in-out',
        opacity: '0',
        pointerEvents: 'none',
    } as Partial<CSSStyleDeclaration>);
    container.appendChild(bottomBar);

    // "REPLAY" label — positioned in the top-right corner
    const label = document.createElement('div');
    Object.assign(label.style, {
        position: 'absolute',
        top: '12%',
        right: '4%',
        zIndex: '2011',
        font: 'bold clamp(10px, 2vw, 16px) monospace',
        color: 'rgba(255, 255, 255, 0.7)',
        letterSpacing: '0.2em',
        textShadow: '0 0 6px rgba(0,0,0,0.6)',
        transition: 'opacity 0.3s ease-in-out',
        opacity: '0',
        pointerEvents: 'none',
    } as Partial<CSSStyleDeclaration>);
    label.textContent = 'REPLAY';
    container.appendChild(label);

    // Self-KO bob animation — injected as a <style> element
    const selfKoStyle = document.createElement('style');
    selfKoStyle.textContent = `
        @keyframes selfKoBob {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-${SELF_KO_BOB_DISTANCE}px); }
        }
    `;
    container.appendChild(selfKoStyle);

    // Self-KO text — displayed when no collision hit occurred
    const selfKoText = document.createElement('div');
    Object.assign(selfKoText.style, {
        position: 'absolute',
        top: '12%',
        left: '4%',
        zIndex: '2012',
        font: 'bold clamp(16px, 4vw, 32px) monospace',
        color: 'rgba(255, 200, 100, 0.9)',
        textShadow: '0 0 10px rgba(0,0,0,0.7)',
        transition: 'opacity 0.3s ease-in-out',
        opacity: '0',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
    } as Partial<CSSStyleDeclaration>);
    container.appendChild(selfKoText);

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
    const trailBurst0 = useParticleBurst({
        count: 5,
        lifetime: 0.8,
        color: PLAYER_COLORS[0],
        speed: [0.2, 0.8],
        gravity: 1,
        size: 0.4,
        blending: 'additive',
        shrink: true,
    });
    const trailBurst1 = useParticleBurst({
        count: 5,
        lifetime: 0.8,
        color: PLAYER_COLORS[1],
        speed: [0.2, 0.8],
        gravity: 1,
        size: 0.4,
        blending: 'additive',
        shrink: true,
    });
    const trailBursts = [trailBurst0, trailBurst1];

    // Transition state
    let wasReplay = false;
    let flashTimer = 0;
    let trailAccum = 0;
    let hitBurstEmitted = false;
    let selfKoMessagePicked = false;

    useFrameUpdate((dt) => {
        const isReplay = gameState.phase === 'replay' && isReplayActive();

        // Detect transition into replay — trigger dark flash
        if (isReplay && !wasReplay) {
            flashTimer = TRANSITION_FLASH_DURATION;
        }
        // Detect transition out of replay — trigger exit flash
        if (!isReplay && wasReplay) {
            flashTimer = TRANSITION_FLASH_DURATION * 0.6;
        }
        wasReplay = isReplay;

        // Animate flash overlay
        if (flashTimer > 0) {
            flashTimer -= dt;
            const t = Math.max(flashTimer, 0) / TRANSITION_FLASH_DURATION;
            flash.style.opacity = String(t);
        } else {
            flash.style.opacity = '0';
        }

        // Letterbox and label
        topBar.style.opacity = isReplay ? '1' : '0';
        bottomBar.style.opacity = isReplay ? '1' : '0';
        label.style.opacity = isReplay ? '1' : '0';

        // Drive replay playback
        if (isReplay) {
            advanceReplay(dt);

            // Self-KO text — per-letter bobbing animation
            if (!hasReplayHit()) {
                if (!selfKoMessagePicked) {
                    const msg =
                        SELF_KO_MESSAGES[
                            Math.floor(Math.random() * SELF_KO_MESSAGES.length)
                        ];
                    selfKoText.innerHTML = '';
                    for (let i = 0; i < msg.length; i++) {
                        const span = document.createElement('span');
                        span.textContent = msg[i] === ' ' ? '\u00A0' : msg[i];
                        span.style.display = 'inline-block';
                        span.style.animation = `selfKoBob ${SELF_KO_BOB_PERIOD}s ease-in-out infinite`;
                        span.style.animationDelay = `${i * SELF_KO_BOB_STAGGER}s`;
                        selfKoText.appendChild(span);
                    }
                    selfKoMessagePicked = true;
                }
                selfKoText.style.opacity = '1';
            } else {
                selfKoText.style.opacity = '0';
            }

            // Hit impact burst at the collision moment
            if (
                hasReplayHit() &&
                !hitBurstEmitted &&
                getReplayHitProximity() > 0.9
            ) {
                const p0 = getReplayPosition(0);
                const p1 = getReplayPosition(1);
                if (p0 && p1) {
                    hitImpactBurst([
                        (p0[0] + p1[0]) / 2,
                        (p0[1] + p1[1]) / 2,
                        (p0[2] + p1[2]) / 2,
                    ]);
                    hitBurstEmitted = true;
                }
            }

            // Velocity-proportional trail particles
            trailAccum += dt;
            const speed = getReplaySpeed();
            const trailInterval =
                speed > 0 ? TRAIL_BASE_INTERVAL / speed : TRAIL_BASE_INTERVAL;
            if (trailAccum >= trailInterval) {
                trailAccum = 0;
                for (let pid = 0; pid < 2; pid++) {
                    const vel = getReplayVelocity(pid);
                    if (!vel) continue;
                    const vmag = Math.sqrt(vel[0] * vel[0] + vel[2] * vel[2]);
                    if (vmag > TRAIL_VELOCITY_THRESHOLD) {
                        const pos = getReplayPosition(pid);
                        if (pos) {
                            trailBursts[pid](pos);
                        }
                    }
                }
            }
        } else {
            selfKoText.style.opacity = '0';
            trailAccum = 0;
            hitBurstEmitted = false;
            selfKoMessagePicked = false;
        }
    });

    useDestroy(() => {
        flash.remove();
        topBar.remove();
        bottomBar.remove();
        label.remove();
        selfKoText.remove();
        selfKoStyle.remove();
    });
}
