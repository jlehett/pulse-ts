import { useFrameUpdate, useContext, useWorld } from '@pulse-ts/core';
import { useThreeContext } from '@pulse-ts/three';
import { useSound } from '@pulse-ts/audio';
import { useChannel, TransportService } from '@pulse-ts/network';
import { useOverlay, Column, Button } from '@pulse-ts/dom';
import { GameCtx } from '../../contexts';
import { RematchChannel, type RematchMessage } from '../../config/channels';
import { applyStaggeredEntrance } from '../../ui/overlayAnimations';
import { isUpdateAvailable } from '../../infra/versionCheck';
import { createAutoReloader } from '../../infra/updateAutoReload';

/** Player colors: P1 = teal, P2 = coral. */
const PLAYER_COLORS = ['#48c9b0', '#e74c3c'];

/** Player labels indexed by player ID. */
const PLAYER_LABELS = ['P1', 'P2'];

/** Rematch negotiation state for online mode. */
type RematchState = 'idle' | 'waiting' | 'requested' | 'declined';

export interface MatchOverOverlayNodeProps {
    /** Callback invoked when the player clicks "Main Menu". */
    onRequestMenu?: () => void;
    /** Callback invoked when a rematch is confirmed (local/solo: immediate, online: mutual). */
    onRequestRematch?: () => void;
    /** Whether this is an online game (enables rematch negotiation protocol). */
    online?: boolean;
}

/**
 * DOM overlay that shows "P1 WINS!" or "P2 WINS!" with a dark backdrop
 * during the `match_over` phase. Includes a "Rematch" button and a
 * "Main Menu" button to return to the title screen.
 */
export function MatchOverOverlayNode(
    props?: Readonly<MatchOverOverlayNodeProps>,
) {
    const gameState = useContext(GameCtx);
    const { renderer } = useThreeContext();
    const container = renderer.domElement.parentElement ?? document.body;

    const reloader = createAutoReloader();

    /** Whether the update banner has been shown for the current match-over. */
    let updateBannerShown = false;

    // --- Online rematch protocol ---
    let rematchState: RematchState = 'idle';
    const world = useWorld();

    /** Flush the network outbox so any just-published channel message
     *  is sent over the wire before the world is torn down. */
    const flushNet = () => world.getService(TransportService)?.flushOutgoing();

    let rematchLabel = 'Rematch';
    let rematchEnabled = true;
    let resultText = '';
    let resultColor = '#fff';
    let showUpdateBanner = false;

    // Rematch click handler
    function onRematchClick() {
        if (props?.online) {
            if (rematchState === 'idle') {
                ch!.publish({ type: 'offer' });
                flushNet();
                rematchState = 'waiting';
            } else if (rematchState === 'requested') {
                reloader.cancel();
                ch!.publish({ type: 'accept' });
                flushNet();
                props.onRequestRematch?.();
            }
        } else {
            reloader.cancel();
            props?.onRequestRematch?.();
        }
    }

    // Menu click handler
    function onMenuClick() {
        reloader.cancel();
        if (props?.online && rematchState === 'requested') {
            ch!.publish({ type: 'decline' });
            flushNet();
        }
        props?.onRequestMenu?.();
    }

    let ch: ReturnType<typeof useChannel<RematchMessage>> | null = null;

    if (props?.online) {
        ch = useChannel(RematchChannel, (msg: RematchMessage) => {
            if (msg.type === 'offer') {
                if (rematchState === 'waiting') {
                    reloader.cancel();
                    props.onRequestRematch?.();
                } else if (rematchState === 'idle') {
                    rematchState = 'requested';
                }
            } else if (msg.type === 'accept') {
                reloader.cancel();
                props.onRequestRematch?.();
            } else if (msg.type === 'decline') {
                rematchState = 'declined';
                setTimeout(() => {
                    props.onRequestMenu?.();
                }, 1500);
            }
        });
    }

    // Sad descending tone for solo-mode loss
    const lossSfx = useSound('tone', {
        wave: 'sine',
        frequency: [400, 150],
        duration: 0.6,
        gain: 0.15,
    });

    const root = useOverlay(
        <div style={{ display: 'contents' }}>
            <div
                style={{
                    position: 'absolute',
                    inset: '0',
                    zIndex: '4000',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    transition: 'opacity 0.5s ease-in',
                    opacity: () =>
                        gameState.phase === 'match_over' ? '1' : '0',
                    pointerEvents: () =>
                        gameState.phase === 'match_over' ? 'auto' : 'none',
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    top: '40%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: '4001',
                    font: 'bold clamp(28px, 8vw, 48px) monospace',
                    textShadow: '0 0 20px rgba(0,0,0,0.9)',
                    transition: 'opacity 0.5s ease-in',
                    opacity: () =>
                        gameState.phase === 'match_over' ? '1' : '0',
                    pointerEvents: 'none',
                    color: () => resultColor,
                }}
            >
                {() => resultText}
            </div>
            <Column
                gap={12}
                style={{
                    position: 'absolute',
                    top: '55%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: '4001',
                    alignItems: 'center',
                    transition: 'opacity 0.5s ease-in',
                    opacity: () =>
                        gameState.phase === 'match_over' ? '1' : '0',
                    pointerEvents: () =>
                        gameState.phase === 'match_over' ? 'auto' : 'none',
                }}
            >
                <Button
                    onClick={onRematchClick}
                    accent="#48c9b0"
                    style={{
                        font: 'bold clamp(14px, 3.5vw, 18px) monospace',
                        border: '2px solid rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        padding: '12px 32px',
                        minHeight: '44px',
                        opacity: () => (rematchEnabled ? '1' : '0.6'),
                        pointerEvents: () => (rematchEnabled ? 'auto' : 'none'),
                    }}
                >
                    {() => rematchLabel}
                </Button>
                <Button
                    onClick={onMenuClick}
                    accent="#48c9b0"
                    style={{
                        font: 'bold clamp(14px, 3.5vw, 18px) monospace',
                        border: '2px solid rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        padding: '12px 32px',
                        minHeight: '44px',
                    }}
                >
                    Main Menu
                </Button>
            </Column>
            <div
                style={{
                    position: 'absolute',
                    top: '8px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: '4002',
                    font: 'bold clamp(12px, 2.5vw, 16px) monospace',
                    color: '#48c9b0',
                    backgroundColor: 'rgba(0,0,0,0.75)',
                    border: '1px solid rgba(72,201,176,0.4)',
                    borderRadius: '6px',
                    padding: '8px 20px',
                    opacity: () => (showUpdateBanner ? '1' : '0'),
                    pointerEvents: 'none',
                    transition: 'opacity 0.4s ease',
                }}
            >
                New version available — updating...
            </div>
        </div>,
        container,
    );

    let wasVisible = false;

    useFrameUpdate(() => {
        const visible = gameState.phase === 'match_over';

        // Update rematch button text/state for online mode
        if (visible && props?.online) {
            switch (rematchState) {
                case 'idle':
                    rematchLabel = 'Rematch';
                    rematchEnabled = true;
                    break;
                case 'waiting':
                    rematchLabel = 'Waiting for opponent...';
                    rematchEnabled = false;
                    break;
                case 'requested':
                    rematchLabel = 'Accept Rematch';
                    rematchEnabled = true;
                    break;
                case 'declined':
                    rematchLabel = 'Opponent declined';
                    rematchEnabled = false;
                    break;
            }
        }

        if (visible) {
            const winner = gameState.matchWinner;
            const labels = gameState.playerConfig?.labels;

            if (labels) {
                // Solo mode --- Victory (teal) or Defeat (red)
                const humanWon = winner === 0;
                resultText = humanWon ? 'Victory' : 'Defeat';
                resultColor = humanWon ? '#48c9b0' : '#e74c3c';
                if (!wasVisible && !humanWon) {
                    lossSfx.play();
                }
            } else {
                resultText = `${PLAYER_LABELS[winner]} WINS!`;
                resultColor = PLAYER_COLORS[winner];
            }

            if (!wasVisible) {
                // Reset rematch state on fresh match-over display
                rematchState = 'idle';
                const rootEl = root as HTMLElement;
                const text = rootEl.children[1] as HTMLElement;
                const buttonCol = rootEl.children[2] as HTMLElement;
                applyStaggeredEntrance([text, buttonCol], 300);

                // Show update banner and schedule reload if a new version landed
                if (isUpdateAvailable() && !updateBannerShown) {
                    updateBannerShown = true;
                    showUpdateBanner = true;
                    reloader.schedule();
                }
            }
        }
        wasVisible = visible;
    });
}
