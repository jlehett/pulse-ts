import type { NetworkServer } from './broker';

/** Options for presence HTTP handler. */
export interface PresenceHttpOptions {
    /** Base path for endpoints. Default: '/presence' */
    basePath?: string;
    /** Enable permissive CORS headers and OPTIONS preflight handling. */
    cors?: boolean;
}

/**
 * Creates a minimal Node-style HTTP handler exposing presence endpoints.
 *
 * Endpoints (relative to basePath):
 * - GET /presence/rooms           -> { rooms: [{ name, count }] }
 * - GET /presence/rooms/:room     -> { room, peers: string[] }
 * - GET /presence/peers           -> { peers: [{ id, rooms }] }
 * - GET /presence/peers/:id       -> { id, rooms } | 404
 * - GET /presence/stats           -> { peers, rooms }
 */
export function createPresenceHttpHandler(
    server: NetworkServer,
    opts: PresenceHttpOptions = {},
) {
    const base = (opts.basePath ?? '/presence').replace(/\/$/, '');
    const enableCors = !!opts.cors;

    return function presenceHandler(req: any, res: any) {
        try {
            const u = new URL(req.url, 'http://local');
            const path = u.pathname;
            if (!path.startsWith(base + '/')) {
                // Not our route; let outer server handle
                res.statusCode = 404;
                res.end();
                return;
            }

            if (enableCors) setCors(res);

            if (req.method === 'OPTIONS') {
                res.statusCode = 204;
                res.end();
                return;
            }

            if (req.method !== 'GET') {
                res.statusCode = 405;
                res.setHeader('Allow', 'GET, OPTIONS');
                res.end();
                return;
            }

            // Routes
            // /presence/rooms
            if (path === base + '/rooms') {
                const rooms = server.listRooms().map((name) => ({
                    name,
                    count: server.peersInRoom(name).length,
                }));
                return json(res, { rooms });
            }

            // /presence/rooms/:room
            const roomMatch = matchParam(path, base + '/rooms/:room');
            if (roomMatch) {
                const peers = server.peersInRoom(roomMatch.room);
                return json(res, { room: roomMatch.room, peers });
            }

            // /presence/peers
            if (path === base + '/peers') {
                const peers = server.listPeers().map((id) => ({
                    id,
                    rooms: server.roomsForPeer(id),
                }));
                return json(res, { peers });
            }

            // /presence/peers/:id
            const peerMatch = matchParam(path, base + '/peers/:id');
            if (peerMatch) {
                const rooms = server.roomsForPeer(peerMatch.id);
                if (!rooms.length)
                    return json(res, { id: peerMatch.id, rooms });
                return json(res, { id: peerMatch.id, rooms });
            }

            // /presence/stats
            if (path === base + '/stats') {
                const rooms = server.listRooms();
                return json(res, {
                    peers: server.listPeers().length,
                    rooms: rooms.length,
                });
            }

            res.statusCode = 404;
            res.end();
        } catch (e) {
            try {
                res.statusCode = 500;
                res.end('error');
            } catch {}
        }
    };
}

function json(res: any, obj: any) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(obj));
}

function setCors(res: any) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function matchParam(
    path: string,
    pattern: string,
): Record<string, string> | null {
    const p = pattern.split('/').filter(Boolean);
    const a = path.split('/').filter(Boolean);
    if (p.length !== a.length) return null;
    const out: Record<string, string> = {};
    for (let i = 0; i < p.length; i++) {
        const pi = p[i]!;
        const ai = a[i]!;
        if (pi.startsWith(':')) out[pi.slice(1)] = decodeURIComponent(ai);
        else if (pi !== ai) return null;
    }
    return out;
}
