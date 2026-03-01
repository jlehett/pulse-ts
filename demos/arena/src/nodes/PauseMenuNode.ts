import { useFrameUpdate, useDestroy, useContext } from '@pulse-ts/core';
import { useAction } from '@pulse-ts/input';
import { useThreeContext } from '@pulse-ts/three';
import { GameCtx } from '../contexts';

export interface PauseMenuNodeProps {
    /** Callback invoked when the player clicks "Exit Match". */
    onRequestMenu?: () => void;
}

/**
 * DOM overlay that shows a pause menu when the player presses Escape
 * during the `playing` phase. Displays "PAUSED" with Resume and
 * Exit Match buttons over a dark backdrop.
 */
export function PauseMenuNode(props?: Readonly<PauseMenuNodeProps>) {
    const gameState = useContext(GameCtx);
    const { renderer } = useThreeContext();
    const container = renderer.domElement.parentElement ?? document.body;
    const getPause = useAction('pause');

    // Dark semi-transparent backdrop
    const backdrop = document.createElement('div');
    Object.assign(backdrop.style, {
        position: 'absolute',
        inset: '0',
        zIndex: '4500',
        backgroundColor: 'rgba(0,0,0,0.7)',
        transition: 'opacity 0.3s ease-in-out',
        opacity: '0',
        pointerEvents: 'none',
    } as Partial<CSSStyleDeclaration>);
    container.appendChild(backdrop);

    // "PAUSED" title
    const title = document.createElement('div');
    Object.assign(title.style, {
        position: 'absolute',
        top: '35%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: '4501',
        font: 'bold 48px monospace',
        color: '#ffffff',
        textShadow: '0 0 20px rgba(0,0,0,0.9)',
        transition: 'opacity 0.3s ease-in-out',
        opacity: '0',
        pointerEvents: 'none',
    } as Partial<CSSStyleDeclaration>);
    title.textContent = 'PAUSED';
    container.appendChild(title);

    /**
     * Create a styled menu button.
     *
     * @param label - Button text.
     * @param color - Accent color for hover effects.
     * @param top - CSS top position.
     * @returns The created button element.
     */
    function createButton(
        label: string,
        color: string,
        top: string,
    ): HTMLButtonElement {
        const btn = document.createElement('button');
        btn.textContent = label;
        Object.assign(btn.style, {
            position: 'absolute',
            top,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: '4501',
            font: 'bold 18px monospace',
            color: '#fff',
            backgroundColor: 'rgba(255,255,255,0.08)',
            border: '2px solid rgba(255,255,255,0.2)',
            borderRadius: '6px',
            padding: '12px 32px',
            cursor: 'pointer',
            transition: 'all 0.2s ease, opacity 0.3s ease-in-out',
            opacity: '0',
            pointerEvents: 'none',
        } as Partial<CSSStyleDeclaration>);
        btn.addEventListener('mouseenter', () => {
            btn.style.backgroundColor = 'rgba(255,255,255,0.15)';
            btn.style.borderColor = color;
            btn.style.boxShadow = `0 0 12px ${color}44`;
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.backgroundColor = 'rgba(255,255,255,0.08)';
            btn.style.borderColor = 'rgba(255,255,255,0.2)';
            btn.style.boxShadow = 'none';
        });
        container.appendChild(btn);
        return btn;
    }

    // Resume button (teal accent)
    const resumeBtn = createButton('Resume', '#48c9b0', '50%');
    resumeBtn.addEventListener('click', () => {
        gameState.paused = false;
    });

    // Exit Match button (coral accent)
    const exitBtn = createButton('Exit Match', '#e74c3c', '60%');
    exitBtn.addEventListener('click', () => {
        gameState.paused = false;
        props?.onRequestMenu?.();
    });

    useFrameUpdate(() => {
        // Toggle pause on Escape press (only during playing phase)
        const action = getPause();
        if (action.pressed) {
            if (gameState.paused) {
                gameState.paused = false;
            } else if (gameState.phase === 'playing') {
                gameState.paused = true;
            }
        }

        const visible = gameState.paused;
        backdrop.style.opacity = visible ? '1' : '0';
        title.style.opacity = visible ? '1' : '0';
        resumeBtn.style.opacity = visible ? '1' : '0';
        exitBtn.style.opacity = visible ? '1' : '0';
        backdrop.style.pointerEvents = visible ? 'auto' : 'none';
        resumeBtn.style.pointerEvents = visible ? 'auto' : 'none';
        exitBtn.style.pointerEvents = visible ? 'auto' : 'none';
    });

    useDestroy(() => {
        backdrop.remove();
        title.remove();
        resumeBtn.remove();
        exitBtn.remove();
    });
}
