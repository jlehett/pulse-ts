import { useFrameUpdate, useDestroy, useContext } from '@pulse-ts/core';
import { useAction } from '@pulse-ts/input';
import { useThreeContext } from '@pulse-ts/three';
import { GameCtx } from '../contexts';

export interface PauseMenuNodeProps {
    /** Callback invoked when the player clicks "Exit Match". */
    onRequestMenu?: () => void;
    /** When true, the overlay does not freeze the game — it's cosmetic only. */
    online?: boolean;
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

    // Content wrapper — flex column for title + buttons
    const content = document.createElement('div');
    Object.assign(content.style, {
        position: 'absolute',
        inset: '0',
        zIndex: '4501',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        transition: 'opacity 0.3s ease-in-out',
        opacity: '0',
        pointerEvents: 'none',
    } as Partial<CSSStyleDeclaration>);
    container.appendChild(content);

    // "PAUSED" title
    const title = document.createElement('div');
    Object.assign(title.style, {
        font: 'bold clamp(28px, 8vw, 48px) monospace',
        color: '#ffffff',
        textShadow: '0 0 20px rgba(0,0,0,0.9)',
        marginBottom: '16px',
    } as Partial<CSSStyleDeclaration>);
    title.textContent = props?.online ? 'MENU' : 'PAUSED';
    content.appendChild(title);

    // Button row — flex column with controlled gap
    const buttonRow = document.createElement('div');
    Object.assign(buttonRow.style, {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        alignItems: 'center',
    } as Partial<CSSStyleDeclaration>);
    content.appendChild(buttonRow);

    /**
     * Create a styled menu button.
     *
     * @param label - Button text.
     * @param color - Accent color for hover effects.
     * @returns The created button element.
     */
    function createButton(label: string, color: string): HTMLButtonElement {
        const btn = document.createElement('button');
        btn.textContent = label;
        Object.assign(btn.style, {
            font: 'bold clamp(14px, 3.5vw, 18px) monospace',
            color: '#fff',
            backgroundColor: 'rgba(255,255,255,0.08)',
            border: '2px solid rgba(255,255,255,0.2)',
            borderRadius: '6px',
            padding: '12px 32px',
            minWidth: 'min(200px, 70vw)',
            minHeight: '44px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
        } as Partial<CSSStyleDeclaration>);
        btn.addEventListener('pointerdown', () => {
            btn.style.backgroundColor = 'rgba(255,255,255,0.15)';
            btn.style.borderColor = color;
            btn.style.boxShadow = `0 0 12px ${color}44`;
        });
        btn.addEventListener('pointerup', () => {
            btn.style.backgroundColor = 'rgba(255,255,255,0.08)';
            btn.style.borderColor = 'rgba(255,255,255,0.2)';
            btn.style.boxShadow = 'none';
        });
        btn.addEventListener('pointerleave', () => {
            btn.style.backgroundColor = 'rgba(255,255,255,0.08)';
            btn.style.borderColor = 'rgba(255,255,255,0.2)';
            btn.style.boxShadow = 'none';
        });
        buttonRow.appendChild(btn);
        return btn;
    }

    // In online mode, track menu visibility locally — never freeze the game
    let showMenu = false;

    // Resume button (teal accent)
    const resumeBtn = createButton('Resume', '#48c9b0');
    resumeBtn.addEventListener('click', () => {
        if (props?.online) {
            showMenu = false;
        } else {
            gameState.paused = false;
        }
    });

    // Exit Match button (coral accent)
    const exitBtn = createButton('Exit Match', '#e74c3c');
    exitBtn.addEventListener('click', () => {
        if (props?.online) {
            showMenu = false;
        } else {
            gameState.paused = false;
        }
        props?.onRequestMenu?.();
    });

    useFrameUpdate(() => {
        // Toggle pause on Escape press (only during playing phase)
        const action = getPause();
        if (action.pressed) {
            if (props?.online) {
                // Online: toggle overlay without freezing the game
                showMenu = !showMenu;
            } else if (gameState.paused) {
                gameState.paused = false;
            } else if (gameState.phase === 'playing') {
                gameState.paused = true;
            }
        }

        const visible = props?.online ? showMenu : gameState.paused;
        backdrop.style.opacity = visible ? '1' : '0';
        content.style.opacity = visible ? '1' : '0';
        backdrop.style.pointerEvents = visible ? 'auto' : 'none';
        content.style.pointerEvents = visible ? 'auto' : 'none';
    });

    useDestroy(() => {
        backdrop.remove();
        content.remove();
    });
}
