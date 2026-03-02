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
} from '../replay';
import { PLAYER_COLORS, REPLAY_DASH_THRESHOLD } from '../config/arena';

/** Height of each cinematic letterbox bar as a CSS value. */
export const LETTERBOX_HEIGHT = '8%';

/** Duration of the dark flash when entering/exiting replay (seconds). */
export const TRANSITION_FLASH_DURATION = 0.4;

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

    // Dash trail particle bursts — one per player, speed scaled for slow-mo
    const trailBurst0 = useParticleBurst({
        count: 3,
        lifetime: 0.5,
        color: PLAYER_COLORS[0],
        speed: [0.2, 0.6],
        gravity: 1,
        size: 0.2,
        blending: 'additive',
        shrink: true,
    });
    const trailBurst1 = useParticleBurst({
        count: 3,
        lifetime: 0.5,
        color: PLAYER_COLORS[1],
        speed: [0.2, 0.6],
        gravity: 1,
        size: 0.2,
        blending: 'additive',
        shrink: true,
    });
    const trailBursts = [trailBurst0, trailBurst1];

    // Transition state
    let wasReplay = false;
    let flashTimer = 0;
    let trailAccum = 0;

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

            // Emit dash trail particles when a player is moving fast
            trailAccum += dt;
            const speed = getReplaySpeed();
            const trailInterval = speed > 0 ? 0.03 / speed : 0.1;
            if (trailAccum >= trailInterval) {
                trailAccum = 0;
                for (let pid = 0; pid < 2; pid++) {
                    const vel = getReplayVelocity(pid);
                    if (!vel) continue;
                    const vmag = Math.sqrt(vel[0] * vel[0] + vel[2] * vel[2]);
                    if (vmag > REPLAY_DASH_THRESHOLD) {
                        const pos = getReplayPosition(pid);
                        if (pos) {
                            trailBursts[pid](pos);
                        }
                    }
                }
            }
        } else {
            trailAccum = 0;
        }
    });

    useDestroy(() => {
        flash.remove();
        topBar.remove();
        bottomBar.remove();
        label.remove();
    });
}
