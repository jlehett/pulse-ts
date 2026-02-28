import { useFrameUpdate, useDestroy, useContext } from '@pulse-ts/core';
import { useThreeContext } from '@pulse-ts/three';
import { GameCtx, PlayerIdCtx } from '../contexts';

/**
 * DOM overlay that shows a white flash and "You scored!" / "Opponent scored!"
 * text during the `ko_flash` phase. Fades out when the phase ends.
 */
export function KnockoutOverlayNode() {
    const gameState = useContext(GameCtx);
    const playerId = useContext(PlayerIdCtx);
    const { renderer } = useThreeContext();
    const container = renderer.domElement.parentElement ?? document.body;

    // Full-viewport flash overlay
    const flash = document.createElement('div');
    Object.assign(flash.style, {
        position: 'absolute',
        inset: '0',
        zIndex: '2000',
        backgroundColor: 'rgba(255,255,255,0.6)',
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
        font: 'bold 28px monospace',
        color: '#fff',
        textShadow: '0 0 8px rgba(0,0,0,0.8)',
        transition: 'opacity 0.3s ease-out',
        opacity: '0',
        pointerEvents: 'none',
    } as Partial<CSSStyleDeclaration>);
    container.appendChild(text);

    useFrameUpdate(() => {
        const visible = gameState.phase === 'ko_flash';
        flash.style.opacity = visible ? '1' : '0';
        text.style.opacity = visible ? '1' : '0';

        if (visible) {
            const scorerIsLocal = gameState.lastKnockedOut !== playerId;
            text.textContent = scorerIsLocal
                ? 'You scored!'
                : 'Opponent scored!';
        }
    });

    useDestroy(() => {
        flash.remove();
        text.remove();
    });
}
