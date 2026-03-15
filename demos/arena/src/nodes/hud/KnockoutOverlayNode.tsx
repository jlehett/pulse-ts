import { useFrameUpdate, useContext } from '@pulse-ts/core';
import { useThreeContext } from '@pulse-ts/three';
import { useOverlay } from '@pulse-ts/dom';
import { GameCtx } from '../../contexts';
import { applyScalePop } from '../../ui/overlayAnimations';

/** Player labels indexed by player ID. */
const PLAYER_LABELS = ['P1', 'P2'];

/** Player flash colors: P1 scores = teal, P2 scores = coral. */
const FLASH_COLORS = ['rgba(72, 201, 176, 0.5)', 'rgba(231, 76, 60, 0.5)'];

/** Neutral flash color for tie rounds. */
const TIE_FLASH_COLOR = 'rgba(180, 180, 180, 0.5)';

/**
 * DOM overlay that shows a player-colored flash and "P1 scored!" / "P2 scored!"
 * text during the `ko_flash` phase. Also shows a gentle dark fade during the
 * `resetting` phase for smoother round transitions.
 */
export function KnockoutOverlayNode() {
    const gameState = useContext(GameCtx);
    const { renderer } = useThreeContext();
    const container = renderer.domElement.parentElement ?? document.body;

    let flashBg = '';
    let textContent = '';
    let wasFlash = false;

    const root = useOverlay(
        <div style={{ display: 'contents' }}>
            <div
                style={{
                    position: 'absolute',
                    inset: '0',
                    zIndex: '2000',
                    transition: 'opacity 0.3s ease-out',
                    opacity: () => (gameState.phase === 'ko_flash' ? '1' : '0'),
                    backgroundColor: () => flashBg,
                    pointerEvents: 'none',
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: '2001',
                    font: 'bold clamp(18px, 5vw, 28px) monospace',
                    color: '#fff',
                    textShadow: '0 0 8px rgba(0,0,0,0.8)',
                    transition: 'opacity 0.3s ease-out',
                    opacity: () => (gameState.phase === 'ko_flash' ? '1' : '0'),
                    pointerEvents: 'none',
                }}
            >
                {() => textContent}
            </div>
            <div
                style={{
                    position: 'absolute',
                    inset: '0',
                    zIndex: '1999',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    transition: 'opacity 0.4s ease-in-out',
                    opacity: () =>
                        gameState.phase === 'resetting' ? '0.3' : '0',
                    pointerEvents: 'none',
                }}
            />
        </div>,
        container,
    );

    useFrameUpdate(() => {
        const isFlash = gameState.phase === 'ko_flash';

        if (isFlash) {
            if (gameState.isTie) {
                textContent = 'Tie!';
                flashBg = TIE_FLASH_COLOR;
            } else {
                const scorer = 1 - gameState.lastKnockedOut;
                const label =
                    gameState.playerConfig?.labels[scorer] ??
                    PLAYER_LABELS[scorer];
                textContent = `${label} scored!`;
                const customColor = gameState.playerConfig?.colors[scorer];
                flashBg = customColor
                    ? customColor
                          .replace('rgb(', 'rgba(')
                          .replace(')', ', 0.5)')
                    : FLASH_COLORS[scorer];
            }

            if (!wasFlash) {
                const rootEl = root as HTMLElement;
                const text = rootEl.children[1] as HTMLElement;
                applyScalePop(text);
            }
        }
        wasFlash = isFlash;
    });
}
