/**
 * Vite plugin that embeds the arena WebSocket relay server into Vite's dev
 * server. This eliminates the need to run a separate relay process during
 * development — hosting "just works" when you start the Vite dev server.
 *
 * The plugin listens for HTTP `upgrade` requests on Vite's server and forwards
 * non-HMR WebSocket connections to the relay's `WebSocketServer`.  Vite's own
 * HMR traffic is identified by the `sec-websocket-protocol: vite-hmr` header
 * and left untouched.
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { arenaRelayPlugin } from './vite-plugin-relay';
 * export default defineConfig({ plugins: [arenaRelayPlugin()] });
 * ```
 */
import type { Plugin } from 'vite';
import { WebSocketServer } from 'ws';
import { attachWsServer } from '../../packages/network/src';

/**
 * Create a Vite plugin that attaches the arena relay to Vite's HTTP server.
 *
 * @returns A Vite plugin object.
 */
export function arenaRelayPlugin(): Plugin {
    return {
        name: 'arena-relay',
        configureServer(server) {
            const wss = new WebSocketServer({ noServer: true });
            attachWsServer(wss, { defaultRoom: 'arena' });

            server.httpServer?.on('upgrade', (req, socket, head) => {
                // Let Vite handle its own HMR WebSocket connections.
                const protocol = req.headers['sec-websocket-protocol'] ?? '';
                if (protocol === 'vite-hmr') return;

                wss.handleUpgrade(req, socket, head, (ws) => {
                    wss.emit('connection', ws, req);
                });
            });
        },
    };
}
