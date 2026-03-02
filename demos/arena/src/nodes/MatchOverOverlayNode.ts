import { useFrameUpdate, useDestroy, useContext } from '@pulse-ts/core';
import { useThreeContext } from '@pulse-ts/three';
import { GameCtx } from '../contexts';

/** Player colors: P1 = teal, P2 = coral. */
const PLAYER_COLORS = ['#48c9b0', '#e74c3c'];

/** Player labels indexed by player ID. */
const PLAYER_LABELS = ['P1', 'P2'];

export interface MatchOverOverlayNodeProps {
    /** Callback invoked when the player clicks "Main Menu". */
    onRequestMenu?: () => void;
}

/**
 * DOM overlay that shows "P1 WINS!" or "P2 WINS!" with a dark backdrop
 * during the `match_over` phase. Includes a "Main Menu" button to return
 * to the title screen.
 */
export function MatchOverOverlayNode(
    props?: Readonly<MatchOverOverlayNodeProps>,
) {
    const gameState = useContext(GameCtx);
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
        top: '40%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: '4001',
        font: 'bold clamp(28px, 8vw, 48px) monospace',
        textShadow: '0 0 20px rgba(0,0,0,0.9)',
        transition: 'opacity 0.5s ease-in',
        opacity: '0',
        pointerEvents: 'none',
    } as Partial<CSSStyleDeclaration>);
    container.appendChild(text);

    // Main Menu button
    const menuBtn = document.createElement('button');
    menuBtn.textContent = 'Main Menu';
    Object.assign(menuBtn.style, {
        position: 'absolute',
        top: '58%',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: '4001',
        font: 'bold clamp(14px, 3.5vw, 18px) monospace',
        color: '#fff',
        backgroundColor: 'rgba(255,255,255,0.08)',
        border: '2px solid rgba(255,255,255,0.2)',
        borderRadius: '6px',
        padding: '12px 32px',
        minHeight: '44px',
        cursor: 'pointer',
        transition: 'all 0.2s ease, opacity 0.5s ease-in',
        opacity: '0',
        pointerEvents: 'none',
    } as Partial<CSSStyleDeclaration>);
    menuBtn.addEventListener('pointerdown', () => {
        menuBtn.style.backgroundColor = 'rgba(255,255,255,0.15)';
        menuBtn.style.borderColor = '#48c9b0';
        menuBtn.style.boxShadow = '0 0 12px #48c9b044';
    });
    menuBtn.addEventListener('pointerup', () => {
        menuBtn.style.backgroundColor = 'rgba(255,255,255,0.08)';
        menuBtn.style.borderColor = 'rgba(255,255,255,0.2)';
        menuBtn.style.boxShadow = 'none';
    });
    menuBtn.addEventListener('pointerleave', () => {
        menuBtn.style.backgroundColor = 'rgba(255,255,255,0.08)';
        menuBtn.style.borderColor = 'rgba(255,255,255,0.2)';
        menuBtn.style.boxShadow = 'none';
    });
    menuBtn.addEventListener('click', () => {
        props?.onRequestMenu?.();
    });
    container.appendChild(menuBtn);

    useFrameUpdate(() => {
        const visible = gameState.phase === 'match_over';
        backdrop.style.opacity = visible ? '1' : '0';
        text.style.opacity = visible ? '1' : '0';
        menuBtn.style.opacity = visible ? '1' : '0';
        backdrop.style.pointerEvents = visible ? 'auto' : 'none';
        menuBtn.style.pointerEvents = visible ? 'auto' : 'none';

        if (visible) {
            const winner = gameState.matchWinner;
            text.textContent = `${PLAYER_LABELS[winner]} WINS!`;
            text.style.color = PLAYER_COLORS[winner];
        }
    });

    useDestroy(() => {
        backdrop.remove();
        text.remove();
        menuBtn.remove();
    });
}
