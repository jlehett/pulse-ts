import { useFrameUpdate, useDestroy, useContext } from '@pulse-ts/core';
import { useThreeContext } from '@pulse-ts/three';
import { GameCtx, PlayerIdCtx } from '../contexts';

/**
 * DOM overlay that shows "YOU WIN!" or "YOU LOSE!" with a dark backdrop
 * during the `match_over` phase. Fades in via CSS transition.
 */
export function MatchOverOverlayNode() {
    const gameState = useContext(GameCtx);
    const playerId = useContext(PlayerIdCtx);
    const { renderer } = useThreeContext();
    const container = renderer.domElement.parentElement ?? document.body;

    // Dark semi-transparent backdrop
    const backdrop = document.createElement('div');
    Object.assign(backdrop.style, {
        position: 'absolute',
        inset: '0',
        zIndex: '4000',
        backgroundColor: 'rgba(0,0,0,0.7)',
        transition: 'opacity 0.5s ease-in',
        opacity: '0',
        pointerEvents: 'none',
    } as Partial<CSSStyleDeclaration>);
    container.appendChild(backdrop);

    // Result text
    const text = document.createElement('div');
    Object.assign(text.style, {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: '4001',
        font: 'bold 48px monospace',
        textShadow: '0 0 20px rgba(0,0,0,0.9)',
        transition: 'opacity 0.5s ease-in',
        opacity: '0',
        pointerEvents: 'none',
    } as Partial<CSSStyleDeclaration>);
    container.appendChild(text);

    useFrameUpdate(() => {
        const visible = gameState.phase === 'match_over';
        backdrop.style.opacity = visible ? '1' : '0';
        text.style.opacity = visible ? '1' : '0';

        if (visible) {
            const isWinner = gameState.matchWinner === playerId;
            text.textContent = isWinner ? 'YOU WIN!' : 'YOU LOSE!';
            text.style.color = isWinner ? '#48c9b0' : '#e74c3c';
        }
    });

    useDestroy(() => {
        backdrop.remove();
        text.remove();
    });
}
