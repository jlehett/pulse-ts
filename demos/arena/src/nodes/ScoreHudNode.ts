import { useFrameUpdate, useDestroy, useContext } from '@pulse-ts/core';
import { useThreeContext } from '@pulse-ts/three';
import { GameCtx, PlayerIdCtx } from '../contexts';
import { loadLeaderboard } from '../leaderboard';

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

    const scoreEl = document.createElement('div');
    el.appendChild(scoreEl);

    const allTimeEl = document.createElement('div');
    Object.assign(allTimeEl.style, {
        fontSize: '10px',
        opacity: '0.7',
        marginTop: '2px',
        textAlign: 'center',
    } as Partial<CSSStyleDeclaration>);
    el.appendChild(allTimeEl);

    const board = loadLeaderboard();
    allTimeEl.textContent = `All-time: P1 ${board.p1Wins} - P2 ${board.p2Wins}`;

    useFrameUpdate(() => {
        scoreEl.textContent =
            `${labels[0]}: ${gameState.scores[indices[0]]}  |  ` +
            `${labels[1]}: ${gameState.scores[indices[1]]}`;

        if (gameState.phase === 'match_over') {
            const updated = loadLeaderboard();
            allTimeEl.textContent = `All-time: P1 ${updated.p1Wins} - P2 ${updated.p2Wins}`;
        }
    });

    useDestroy(() => {
        el.remove();
    });
}
