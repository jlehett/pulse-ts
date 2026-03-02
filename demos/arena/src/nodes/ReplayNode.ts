import { useFrameUpdate, useDestroy, useContext } from '@pulse-ts/core';
import { useThreeContext } from '@pulse-ts/three';
import { GameCtx } from '../contexts';
import { advanceReplay, isReplayActive } from '../replay';

/** Height of each cinematic letterbox bar as a CSS value. */
export const LETTERBOX_HEIGHT = '8%';

/**
 * DOM overlay that displays cinematic letterboxing and a "REPLAY" label
 * during the replay phase. Drives the replay playback by calling
 * `advanceReplay(dt)` each frame.
 */
export function ReplayNode() {
    const gameState = useContext(GameCtx);
    const { renderer } = useThreeContext();
    const container = renderer.domElement.parentElement ?? document.body;

    // Top letterbox bar
    const topBar = document.createElement('div');
    Object.assign(topBar.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        height: LETTERBOX_HEIGHT,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        zIndex: '2010',
        transition: 'opacity 0.3s ease-in-out',
        opacity: '0',
        pointerEvents: 'none',
    } as Partial<CSSStyleDeclaration>);
    container.appendChild(topBar);

    // Bottom letterbox bar
    const bottomBar = document.createElement('div');
    Object.assign(bottomBar.style, {
        position: 'absolute',
        bottom: '0',
        left: '0',
        right: '0',
        height: LETTERBOX_HEIGHT,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        zIndex: '2010',
        transition: 'opacity 0.3s ease-in-out',
        opacity: '0',
        pointerEvents: 'none',
    } as Partial<CSSStyleDeclaration>);
    container.appendChild(bottomBar);

    // "REPLAY" label — positioned in the top-right corner
    const label = document.createElement('div');
    Object.assign(label.style, {
        position: 'absolute',
        top: '12%',
        right: '4%',
        zIndex: '2011',
        font: 'bold clamp(10px, 2vw, 16px) monospace',
        color: 'rgba(255, 255, 255, 0.7)',
        letterSpacing: '0.2em',
        textShadow: '0 0 6px rgba(0,0,0,0.6)',
        transition: 'opacity 0.3s ease-in-out',
        opacity: '0',
        pointerEvents: 'none',
    } as Partial<CSSStyleDeclaration>);
    label.textContent = 'REPLAY';
    container.appendChild(label);

    useFrameUpdate((dt) => {
        const isReplay = gameState.phase === 'replay' && isReplayActive();

        topBar.style.opacity = isReplay ? '1' : '0';
        bottomBar.style.opacity = isReplay ? '1' : '0';
        label.style.opacity = isReplay ? '1' : '0';

        // Drive replay playback
        if (isReplay) {
            advanceReplay(dt);
        }
    });

    useDestroy(() => {
        topBar.remove();
        bottomBar.remove();
        label.remove();
    });
}
