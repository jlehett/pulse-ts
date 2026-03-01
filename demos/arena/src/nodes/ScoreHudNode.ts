import { useFrameUpdate, useDestroy, useContext } from '@pulse-ts/core';
import { useThreeContext } from '@pulse-ts/three';
import { GameCtx } from '../contexts';
import { loadLeaderboard } from '../leaderboard';

/**
 * DOM overlay showing P1 and P2 scores.
 * Positioned at the top-center of the canvas.
 */
export function ScoreHudNode() {
    const gameState = useContext(GameCtx);
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

    useFrameUpdate(() => {
        const board = loadLeaderboard();
        el.textContent =
            `P1: ${gameState.scores[0]}  |  P2: ${gameState.scores[1]}` +
            `    ALL-TIME  P1: ${board.p1Wins}  P2: ${board.p2Wins}`;
    });

    useDestroy(() => {
        el.remove();
    });
}
