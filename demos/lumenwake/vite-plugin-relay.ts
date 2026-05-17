import type { Plugin } from 'vite';
import { WebSocketServer } from 'ws';
import { attachWsServer } from '../../packages/network/src';

/**
 * Vite plugin that embeds a WebSocket relay server into Vite's dev server
 * for local multiplayer testing without a separate signaling process.
 */
export function lumenwakeRelayPlugin(): Plugin {
    return {
        name: 'lumenwake-relay',
        configureServer(server) {
            const wss = new WebSocketServer({ noServer: true });
            attachWsServer(wss, { defaultRoom: 'lumenwake' });

            server.httpServer?.on('upgrade', (req, socket, head) => {
                const protocol = req.headers['sec-websocket-protocol'] ?? '';
                if (protocol === 'vite-hmr') return;

                wss.handleUpgrade(req, socket, head, (ws) => {
                    wss.emit('connection', ws, req);
                });
            });
        },
    };
}
