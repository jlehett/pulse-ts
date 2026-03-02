import { useFrameUpdate, useDestroy, useContext } from '@pulse-ts/core';
import { useThreeContext } from '@pulse-ts/three';
import { GameCtx } from '../contexts';
import { ANIM_EASING } from '../overlayAnimations';

/** Player colors: P1 = teal, P2 = coral. */
const SCORE_COLORS = ['#48c9b0', '#e74c3c'];

/**
 * DOM overlay showing P1 and P2 scores with player-colored text.
 * Positioned at the top-center of the canvas. Score values pop-scale
 * briefly when they change.
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
        padding: '6px 16px',
        font: 'bold 16px monospace',
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: '4px',
        pointerEvents: 'none',
        display: 'flex',
        gap: '6px',
        alignItems: 'center',
    } as Partial<CSSStyleDeclaration>);
    container.appendChild(el);

    // Separate spans for colored scores + divider
    const p1Span = document.createElement('span');
    p1Span.style.color = SCORE_COLORS[0];
    p1Span.style.transition = `transform 200ms ${ANIM_EASING}`;
    p1Span.style.display = 'inline-block';

    const divider = document.createElement('span');
    divider.textContent = '|';
    divider.style.color = '#666';

    const p2Span = document.createElement('span');
    p2Span.style.color = SCORE_COLORS[1];
    p2Span.style.transition = `transform 200ms ${ANIM_EASING}`;
    p2Span.style.display = 'inline-block';

    el.appendChild(p1Span);
    el.appendChild(divider);
    el.appendChild(p2Span);

    let lastP1 = -1;
    let lastP2 = -1;

    /**
     * Apply a brief scale pop to a score span.
     *
     * @param span - The span element to pop.
     */
    function popScore(span: HTMLElement): void {
        span.style.transition = 'none';
        span.style.transform = 'scale(1.4)';
        requestAnimationFrame(() => {
            span.style.transition = `transform 200ms ${ANIM_EASING}`;
            span.style.transform = 'scale(1)';
        });
    }

    useFrameUpdate(() => {
        const s0 = gameState.scores[0];
        const s1 = gameState.scores[1];

        p1Span.textContent = `P1: ${s0}`;
        p2Span.textContent = `P2: ${s1}`;

        if (s0 !== lastP1 && lastP1 !== -1) popScore(p1Span);
        if (s1 !== lastP2 && lastP2 !== -1) popScore(p2Span);

        lastP1 = s0;
        lastP2 = s1;
    });

    useDestroy(() => {
        el.remove();
    });
}
