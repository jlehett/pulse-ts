import { createElement, Column, Button } from '@pulse-ts/dom';
import type { Transport } from '@pulse-ts/network';

export interface LobbyResult {
    mode: 'host' | 'join';
    playerId: number;
    playerCount: number;
    transport: Transport;
}

/**
 * Show the lobby flow for online co-op.
 * Returns lobby result or 'back' if the player cancels.
 *
 * TODO: Full lobby implementation in TICKET-161.
 */
export function showLobby(
    container: HTMLElement,
): Promise<LobbyResult | 'back'> {
    return new Promise((resolve) => {
        const { root } = createElement(
            <div
                style={{
                    position: 'absolute',
                    inset: '0',
                    zIndex: '5000',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '20px',
                    backgroundColor: 'rgba(2, 2, 6, 0.9)',
                }}
            >
                <div
                    style={{
                        font: 'bold 24px monospace',
                        color: '#aaa',
                    }}
                >
                    Online lobby coming soon...
                </div>
                <Column gap={12}>
                    <Button
                        onClick={() => {
                            container.removeChild(root);
                            resolve('back');
                        }}
                        style={{
                            padding: '12px 36px',
                            font: 'bold 16px monospace',
                            color: '#fff',
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }}
                    >
                        Back
                    </Button>
                </Column>
            </div>,
        );

        container.appendChild(root);
    });
}
