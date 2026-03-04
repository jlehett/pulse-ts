import { useFrameUpdate, useDestroy, useContext } from '@pulse-ts/core';
import { useThreeContext } from '@pulse-ts/three';
import { useSound } from '@pulse-ts/audio';
import { useChannel } from '@pulse-ts/network';
import { GameCtx } from '../contexts';
import { RematchChannel, type RematchMessage } from '../config/channels';
import {
    applyStaggeredEntrance,
    applyButtonHoverScale,
} from '../overlayAnimations';

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

    // Button column container
    const buttonCol = document.createElement('div');
    Object.assign(buttonCol.style, {
        position: 'absolute',
        top: '55%',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: '4001',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        transition: 'opacity 0.5s ease-in',
        opacity: '0',
        pointerEvents: 'none',
    } as Partial<CSSStyleDeclaration>);
    container.appendChild(buttonCol);

    // Shared button style factory
    const createButton = (label: string): HTMLButtonElement => {
        const btn = document.createElement('button');
        btn.textContent = label;
        Object.assign(btn.style, {
            font: 'bold clamp(14px, 3.5vw, 18px) monospace',
            color: '#fff',
            backgroundColor: 'rgba(255,255,255,0.08)',
            border: '2px solid rgba(255,255,255,0.2)',
            borderRadius: '6px',
            padding: '12px 32px',
            minHeight: '44px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
        } as Partial<CSSStyleDeclaration>);

        const addPressEffect = (b: HTMLButtonElement) => {
            b.addEventListener('pointerdown', () => {
                b.style.backgroundColor = 'rgba(255,255,255,0.15)';
                b.style.borderColor = '#48c9b0';
                b.style.boxShadow = '0 0 12px #48c9b044';
            });
            b.addEventListener('pointerup', () => {
                b.style.backgroundColor = 'rgba(255,255,255,0.08)';
                b.style.borderColor = 'rgba(255,255,255,0.2)';
                b.style.boxShadow = 'none';
            });
            b.addEventListener('pointerleave', () => {
                b.style.backgroundColor = 'rgba(255,255,255,0.08)';
                b.style.borderColor = 'rgba(255,255,255,0.2)';
                b.style.boxShadow = 'none';
            });
        };

        addPressEffect(btn);
        return btn;
    };

    // Rematch button
    const rematchBtn = createButton('Rematch');
    buttonCol.appendChild(rematchBtn);
    applyButtonHoverScale(rematchBtn);

    // Main Menu button
    const menuBtn = createButton('Main Menu');
    buttonCol.appendChild(menuBtn);
    applyButtonHoverScale(menuBtn);

    // --- Online rematch protocol ---
    let rematchState: RematchState = 'idle';

    if (props?.online) {
        const ch = useChannel(RematchChannel, (msg: RematchMessage) => {
            if (msg.type === 'offer') {
                if (rematchState === 'waiting') {
                    // Mutual agreement — both offered
                    props.onRequestRematch?.();
                } else if (rematchState === 'idle') {
                    rematchState = 'requested';
                }
            } else if (msg.type === 'accept') {
                props.onRequestRematch?.();
            } else if (msg.type === 'decline') {
                rematchState = 'declined';
                setTimeout(() => {
                    props.onRequestMenu?.();
                }, 1500);
            }
        });

        rematchBtn.addEventListener('click', () => {
            if (rematchState === 'idle') {
                ch.publish({ type: 'offer' });
                rematchState = 'waiting';
            } else if (rematchState === 'requested') {
                ch.publish({ type: 'accept' });
                props.onRequestRematch?.();
            }
        });

        menuBtn.addEventListener('click', () => {
            if (rematchState === 'requested') {
                ch.publish({ type: 'decline' });
            }
            props.onRequestMenu?.();
        });
    } else {
        // Local/solo mode — immediate rematch
        rematchBtn.addEventListener('click', () => {
            props?.onRequestRematch?.();
        });

        menuBtn.addEventListener('click', () => {
            props?.onRequestMenu?.();
        });
    }

    // Sad descending tone for solo-mode loss
    const lossSfx = useSound('tone', {
        wave: 'sine',
        frequency: [400, 150],
        duration: 0.6,
        gain: 0.15,
    });

    let wasVisible = false;

    useFrameUpdate(() => {
        const visible = gameState.phase === 'match_over';
        backdrop.style.opacity = visible ? '1' : '0';
        text.style.opacity = visible ? '1' : '0';
        buttonCol.style.opacity = visible ? '1' : '0';
        backdrop.style.pointerEvents = visible ? 'auto' : 'none';
        buttonCol.style.pointerEvents = visible ? 'auto' : 'none';

        // Update rematch button text/state for online mode
        if (visible && props?.online) {
            switch (rematchState) {
                case 'idle':
                    rematchBtn.textContent = 'Rematch';
                    rematchBtn.style.pointerEvents = 'auto';
                    rematchBtn.style.opacity = '1';
                    break;
                case 'waiting':
                    rematchBtn.textContent = 'Waiting for opponent...';
                    rematchBtn.style.pointerEvents = 'none';
                    rematchBtn.style.opacity = '0.6';
                    break;
                case 'requested':
                    rematchBtn.textContent = 'Accept Rematch';
                    rematchBtn.style.pointerEvents = 'auto';
                    rematchBtn.style.opacity = '1';
                    break;
                case 'declined':
                    rematchBtn.textContent = 'Opponent declined';
                    rematchBtn.style.pointerEvents = 'none';
                    rematchBtn.style.opacity = '0.6';
                    break;
            }
        }

        if (visible) {
            const winner = gameState.matchWinner;
            const labels = gameState.playerLabels;

            if (labels) {
                // Solo mode — Victory (teal) or Defeat (red)
                const humanWon = winner === 0;
                text.textContent = humanWon ? 'Victory' : 'Defeat';
                text.style.color = humanWon ? '#48c9b0' : '#e74c3c';
                if (!wasVisible && !humanWon) {
                    lossSfx.play();
                }
            } else {
                text.textContent = `${PLAYER_LABELS[winner]} WINS!`;
                text.style.color = PLAYER_COLORS[winner];
            }

            if (!wasVisible) {
                // Reset rematch state on fresh match-over display
                rematchState = 'idle';
                applyStaggeredEntrance([text, buttonCol], 300);
            }
        }
        wasVisible = visible;
    });

    useDestroy(() => {
        backdrop.remove();
        text.remove();
        buttonCol.remove();
    });
}
