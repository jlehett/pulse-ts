/**
 * WebSocket relay server for the arena demo's online play mode.
 *
 * Run with:
 * ```sh
 * npx tsx src/server.ts
 * ```
 *
 * Then use the in-game menu: Online Play → Host Game / Join Game.
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
