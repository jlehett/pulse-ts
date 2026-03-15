import { useFrameUpdate } from '@pulse-ts/core';
import { useThreeContext } from '@pulse-ts/three';
import { useOnPeerLeave } from '@pulse-ts/network';
import { useOverlay, Button } from '@pulse-ts/dom';
import { applyStaggeredEntrance } from '../../ui/overlayAnimations';

export interface DisconnectOverlayNodeProps {
    /** Whether the local player is the host. Determines the disconnect message. */
    isHost: boolean;
    /** Callback invoked when the player clicks "Main Menu". */
    onRequestMenu?: () => void;
}

/**
 * DOM overlay that appears when the remote player disconnects from an
 * online match. Shows a contextual message ("Host ended the match" or
 * "The other player left the match") with a button to return to the
 * main menu.
 */
export function DisconnectOverlayNode(
    props: Readonly<DisconnectOverlayNodeProps>,
) {
    const { renderer } = useThreeContext();
    const container = renderer.domElement.parentElement ?? document.body;

    let disconnected = false;

    useOnPeerLeave(() => {
        disconnected = true;
    });

    const root = useOverlay(
        <div
            style={{
                position: 'absolute',
                inset: '0',
                zIndex: '5000',
                backgroundColor: 'rgba(0,0,0,0.7)',
                transition: 'opacity 0.5s ease-in',
                opacity: () => (disconnected ? '1' : '0'),
                pointerEvents: () => (disconnected ? 'auto' : 'none'),
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '24px',
            }}
        >
            <div
                style={{
                    font: 'bold clamp(22px, 6vw, 36px) monospace',
                    color: '#ffffff',
                    textAlign: 'center',
                    maxWidth: '90vw',
                    wordWrap: 'break-word',
                    textShadow: '0 0 20px rgba(0,0,0,0.9)',
                }}
            >
                {props.isHost
                    ? 'The other player left the match'
                    : 'Host ended the match'}
            </div>
            <Button
                onClick={() => props.onRequestMenu?.()}
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
        </div>,
        container,
    );

    let wasDisconnected = false;

    useFrameUpdate(() => {
        if (disconnected && !wasDisconnected) {
            const rootEl = root as HTMLElement;
            const text = rootEl.children[0] as HTMLElement;
            const btn = rootEl.children[1] as HTMLElement;
            applyStaggeredEntrance([text, btn], 300);
        }
        wasDisconnected = disconnected;
    });
}
