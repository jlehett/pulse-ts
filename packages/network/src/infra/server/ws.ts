import { NetworkServer } from './broker';

export type WsConn = {
    on(event: 'message', cb: (data: any, isBinary?: boolean) => void): void;
    on(event: 'close', cb: (code: number, reason: Buffer) => void): void;
    on(event: 'error', cb: (err: any) => void): void;
    send(data: string | ArrayBufferView | ArrayBufferLike): void;
    close(code?: number, reason?: string): void;
};

export type WsServer = {
    on(event: 'connection', cb: (ws: WsConn, req: any) => void): void;
};

/**
 * Attaches a Node 'ws' WebSocketServer to a NetworkServer.
 *
 * @param wss WebSocketServer from the 'ws' package.
 * @param opts NetworkServer options.
 * @returns The created NetworkServer instance.
 *
 * @example
 * const { WebSocketServer } = require('ws')
 * const wss = new WebSocketServer({ port: 8080 })
 * const server = attachWsServer(wss, { defaultRoom: 'lobby' })
 */
export function attachWsServer(
    wss: WsServer,
    opts?: ConstructorParameters<typeof NetworkServer>[0],
) {
    const srv = new NetworkServer(opts);
    srv.attachWebSocketServer(wss);
    return srv;
}
