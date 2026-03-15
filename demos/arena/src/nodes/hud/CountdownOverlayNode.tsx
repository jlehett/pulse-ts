import { useFrameUpdate, useContext } from '@pulse-ts/core';
import { useThreeContext } from '@pulse-ts/three';
import { useOverlay } from '@pulse-ts/dom';
import { GameCtx } from '../contexts';
import { applyScalePop } from '../overlayAnimations';

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

    const root = useOverlay(
        <div
            style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: '3000',
                font: 'bold clamp(40px, 14vw, 72px) monospace',
                color: '#fff',
                textShadow: '0 0 16px rgba(0,0,0,0.8)',
                transition: 'opacity 0.2s ease-out',
                opacity: () => (gameState.phase === 'countdown' ? '1' : '0'),
                pointerEvents: 'none',
            }}
        >
            {() => countdownLabel(gameState.countdownValue)}
        </div>,
        container,
    );

    let lastValue = -1;

    useFrameUpdate(() => {
        const visible = gameState.phase === 'countdown';

        if (visible) {
            if (gameState.countdownValue !== lastValue) {
                lastValue = gameState.countdownValue;
                applyScalePop(root as HTMLElement);
            }
        } else {
            lastValue = -1;
        }
    });
}
