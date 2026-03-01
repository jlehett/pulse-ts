import { useFrameUpdate, useDestroy, useContext } from '@pulse-ts/core';
import { useThreeContext } from '@pulse-ts/three';
import { GameCtx, PlayerIdCtx } from '../contexts';

/**
 * DOM overlay showing P1 and P2 scores.
 * Positioned at the top-center of each canvas.
 */
export function ScoreHudNode() {
    const gameState = useContext(GameCtx);
    const playerId = useContext(PlayerIdCtx);
    const { renderer } = useThreeContext();
    const container = renderer.domElement.parentElement ?? document.body;

    const el = document.createElement('div');
    Object.assign(el.style, {
        position: 'absolute',
        top: '4px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: '1000',
        padding: '4px 12px',
        font: '14px monospace',
        color: '#fff',
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: '4px',
        pointerEvents: 'none',
    } as Partial<CSSStyleDeclaration>);
    container.appendChild(el);

    const labels = playerId === 0 ? ['P1', 'P2'] : ['P2', 'P1'];
    const indices = playerId === 0 ? [0, 1] : [1, 0];

    useFrameUpdate(() => {
        el.textContent =
            `${labels[0]}: ${gameState.scores[indices[0]]}  |  ` +
            `${labels[1]}: ${gameState.scores[indices[1]]}`;
    });

    useDestroy(() => {
        el.remove();
    });
}
