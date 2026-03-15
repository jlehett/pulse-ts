/**
 * Standalone WebSocket relay server for the arena demo's online play mode.
 *
 * **During development** the relay is embedded in the Vite dev server via
 * `vite-plugin-relay.ts`, so you do **not** need to run this file separately.
 * Just start the dev server (`npm run demo:arena`) and hosting works
 * automatically.
 *
 * This standalone server is kept for **production or non-Vite deployments**
 * where the game client is served separately from the relay.
 *
 * Run with:
 * ```sh
 * npx tsx src/server.ts
 * ```
 *
 * The server relays messages between connected clients using
 * {@link attachWsServer} with a default `"arena"` room.
 */
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { attachWsServer } from '@pulse-ts/network';

const PORT = 8080;

const httpServer = createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Pulse arena relay server');
});

const wss = new WebSocketServer({ server: httpServer });
attachWsServer(wss as any, { defaultRoom: 'arena' });

httpServer.listen(PORT, () => {
    console.log(`Arena relay server listening on ws://localhost:${PORT}`);
});
