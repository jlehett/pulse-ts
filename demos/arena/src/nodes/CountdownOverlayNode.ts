import { useFrameUpdate, useDestroy, useContext } from '@pulse-ts/core';
import { useThreeContext } from '@pulse-ts/three';
import { GameCtx } from '../contexts';

/**
 * Convert a countdown numeric value to a display label.
 *
 * @param value - Countdown value (3, 2, 1, or 0).
 * @returns The string label to display.
 *
 * @example
 * ```ts
 * countdownLabel(3); // '3'
 * countdownLabel(1); // '1'
 * countdownLabel(0); // 'GO!'
 * ```
 */
export function countdownLabel(value: number): string {
    return value > 0 ? String(value) : 'GO!';
}

/**
 * DOM overlay that shows a large centered countdown ("3", "2", "1", "GO!")
 * during the `countdown` phase.
 */
export function CountdownOverlayNode() {
    const gameState = useContext(GameCtx);
    const { renderer } = useThreeContext();
    const container = renderer.domElement.parentElement ?? document.body;

    const el = document.createElement('div');
    Object.assign(el.style, {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: '3000',
        font: 'bold 72px monospace',
        color: '#fff',
        textShadow: '0 0 16px rgba(0,0,0,0.8)',
        transition: 'opacity 0.2s ease-out',
        opacity: '0',
        pointerEvents: 'none',
    } as Partial<CSSStyleDeclaration>);
    container.appendChild(el);

    useFrameUpdate(() => {
        const visible = gameState.phase === 'countdown';
        el.style.opacity = visible ? '1' : '0';

        if (visible) {
            el.textContent = countdownLabel(gameState.countdownValue);
        }
    });

    useDestroy(() => {
        el.remove();
    });
}
