import { useFrameUpdate, useDestroy, useContext } from '@pulse-ts/core';
import { useThreeContext } from '@pulse-ts/three';
import { GameCtx } from '../contexts';
import { applyScalePop } from '../overlayAnimations';

/** Player labels indexed by player ID. */
const PLAYER_LABELS = ['P1', 'P2'];

/** Player flash colors: P1 scores = teal, P2 scores = coral. */
const FLASH_COLORS = ['rgba(72, 201, 176, 0.5)', 'rgba(231, 76, 60, 0.5)'];

/** Neutral flash color for tie rounds. */
const TIE_FLASH_COLOR = 'rgba(180, 180, 180, 0.5)';

/**
 * DOM overlay that shows a player-colored flash and "P1 scored!" / "P2 scored!"
 * text during the `ko_flash` phase. Also shows a gentle dark fade during the
 * `resetting` phase for smoother round transitions.
 */
export function KnockoutOverlayNode() {
    const gameState = useContext(GameCtx);
    const { renderer } = useThreeContext();
    const container = renderer.domElement.parentElement ?? document.body;

    // Full-viewport flash overlay — colored per scoring player
    const flash = document.createElement('div');
    Object.assign(flash.style, {
        position: 'absolute',
        inset: '0',
        zIndex: '2000',
        transition: 'opacity 0.3s ease-out',
        opacity: '0',
        pointerEvents: 'none',
    } as Partial<CSSStyleDeclaration>);
    container.appendChild(flash);

    // Centered KO text
    const text = document.createElement('div');
    Object.assign(text.style, {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: '2001',
        font: 'bold clamp(18px, 5vw, 28px) monospace',
        color: '#fff',
        textShadow: '0 0 8px rgba(0,0,0,0.8)',
        transition: 'opacity 0.3s ease-out',
        opacity: '0',
        pointerEvents: 'none',
    } as Partial<CSSStyleDeclaration>);
    container.appendChild(text);

    // Gentle dark fade during resetting phase
    const resetFade = document.createElement('div');
    Object.assign(resetFade.style, {
        position: 'absolute',
        inset: '0',
        zIndex: '1999',
        backgroundColor: 'rgba(0,0,0,0.5)',
        transition: 'opacity 0.4s ease-in-out',
        opacity: '0',
        pointerEvents: 'none',
    } as Partial<CSSStyleDeclaration>);
    container.appendChild(resetFade);

    let wasFlash = false;

    useFrameUpdate(() => {
        const isFlash = gameState.phase === 'ko_flash';
        const isResetting = gameState.phase === 'resetting';

        // KO flash
        flash.style.opacity = isFlash ? '1' : '0';
        text.style.opacity = isFlash ? '1' : '0';

        if (isFlash) {
            if (gameState.isTie) {
                text.textContent = 'Tie!';
                flash.style.backgroundColor = TIE_FLASH_COLOR;
            } else {
                const scorer = 1 - gameState.lastKnockedOut;
                text.textContent = `${PLAYER_LABELS[scorer]} scored!`;
                flash.style.backgroundColor = FLASH_COLORS[scorer];
            }

            if (!wasFlash) {
                applyScalePop(text);
            }
        }
        wasFlash = isFlash;

        // Resetting fade
        resetFade.style.opacity = isResetting ? '0.3' : '0';
    });

    useDestroy(() => {
        flash.remove();
        text.remove();
        resetFade.remove();
    });
}
