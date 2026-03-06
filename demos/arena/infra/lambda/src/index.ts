/**
 * Signaling server Lambda handler for arena online play.
 *
 * Handles WebSocket API Gateway routes ($connect, $disconnect, $default)
 * for lobby management and WebRTC signaling relay.
 *
 * @see {@link types.ts} for the full protocol type definitions.
 */

import {
    DynamoDBClient,
    PutItemCommand,
    GetItemCommand,
    DeleteItemCommand,
    ScanCommand,
} from '@aws-sdk/client-dynamodb';
import type { AttributeValue } from '@aws-sdk/client-dynamodb';
import {
    ApiGatewayManagementApiClient,
    PostToConnectionCommand,
} from '@aws-sdk/client-apigatewaymanagementapi';
import {
    KinesisVideoClient,
    GetSignalingChannelEndpointCommand,
    ChannelProtocol,
    SingleMasterChannelEndpointConfiguration,
} from '@aws-sdk/client-kinesis-video';
import {
    KinesisVideoSignalingClient,
    GetIceServerConfigCommand,
} from '@aws-sdk/client-kinesis-video-signaling';

import type {
    WebSocketEvent,
    LambdaResponse,
    ServerMessage,
    ConnectionRecord,
    LobbyRecord,
    LobbyListEntry,
    JoinResult,
} from './types';

const dynamo = new DynamoDBClient({});

const LOBBIES_TABLE = process.env.LOBBIES_TABLE!;
const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE!;
const KVS_CHANNEL_ARN = process.env.KVS_CHANNEL_ARN!;

/** TTL for lobbies and connections: 1 hour. */
const TTL_SECONDS = 3600;

/** Compute a TTL timestamp (seconds since epoch) for DynamoDB. */
function ttl(): string {
    return String(Math.floor(Date.now() / 1000) + TTL_SECONDS);
}

// ---------------------------------------------------------------------------
// API Gateway management
// ---------------------------------------------------------------------------

/**
 * Build the API Gateway management client from the event context.
 *
 * @param event - API Gateway WebSocket event.
 * @returns A client for posting messages back to WebSocket connections.
 */
function getApigwClient(event: WebSocketEvent): ApiGatewayManagementApiClient {
    const { domainName, stage } = event.requestContext;
    return new ApiGatewayManagementApiClient({
        endpoint: `https://${domainName}/${stage}`,
    });
}

/**
 * Send a JSON message to a specific WebSocket connection.
 *
 * @param apigw - API Gateway management client.
 * @param connectionId - Target connection ID.
 * @param payload - Message to send.
 */
async function send(
    apigw: ApiGatewayManagementApiClient,
    connectionId: string,
    payload: ServerMessage,
): Promise<void> {
    try {
        await apigw.send(
            new PostToConnectionCommand({
                ConnectionId: connectionId,
                Data: JSON.stringify(payload),
            }),
        );
    } catch (err: unknown) {
        if ((err as { statusCode?: number }).statusCode === 410) {
            await removeConnection(connectionId);
        }
    }
}

// ---------------------------------------------------------------------------
// Connection tracking
// ---------------------------------------------------------------------------

async function saveConnection(connectionId: string): Promise<void> {
    await dynamo.send(
        new PutItemCommand({
            TableName: CONNECTIONS_TABLE,
            Item: {
                connectionId: { S: connectionId },
                lobbyId: { S: '' },
                role: { S: '' },
                peerId: { S: '' },
                expiresAt: { N: ttl() },
            },
        }),
    );
}

async function getConnection(
    connectionId: string,
): Promise<ConnectionRecord | null> {
    const res = await dynamo.send(
        new GetItemCommand({
            TableName: CONNECTIONS_TABLE,
            Key: { connectionId: { S: connectionId } },
        }),
    );
    if (!res.Item) return null;
    return {
        connectionId: res.Item.connectionId.S!,
        lobbyId: res.Item.lobbyId?.S || '',
        role: (res.Item.role?.S || '') as ConnectionRecord['role'],
        peerId: res.Item.peerId?.S || '',
    };
}

async function updateConnection(
    connectionId: string,
    fields: Record<string, string>,
): Promise<void> {
    const item: Record<string, AttributeValue> = {
        connectionId: { S: connectionId },
        expiresAt: { N: ttl() },
    };
    for (const [k, v] of Object.entries(fields)) {
        item[k] = { S: String(v) };
    }
    await dynamo.send(
        new PutItemCommand({ TableName: CONNECTIONS_TABLE, Item: item }),
    );
}

async function removeConnection(connectionId: string): Promise<void> {
    await dynamo.send(
        new DeleteItemCommand({
            TableName: CONNECTIONS_TABLE,
            Key: { connectionId: { S: connectionId } },
        }),
    );
}

// ---------------------------------------------------------------------------
// Lobby management
// ---------------------------------------------------------------------------

async function createLobby(
    connectionId: string,
    username: string,
): Promise<string> {
    const lobbyId = `lobby-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await dynamo.send(
        new PutItemCommand({
            TableName: LOBBIES_TABLE,
            Item: {
                lobbyId: { S: lobbyId },
                hostConnectionId: { S: connectionId },
                hostUsername: { S: username },
                joinerConnectionId: { S: '' },
                joinerUsername: { S: '' },
                status: { S: 'waiting' },
                expiresAt: { N: ttl() },
            },
        }),
    );
    await updateConnection(connectionId, { lobbyId, role: 'host' });
    return lobbyId;
}

async function getLobby(lobbyId: string): Promise<LobbyRecord | null> {
    const res = await dynamo.send(
        new GetItemCommand({
            TableName: LOBBIES_TABLE,
            Key: { lobbyId: { S: lobbyId } },
        }),
    );
    if (!res.Item) return null;
    return {
        lobbyId: res.Item.lobbyId.S!,
        hostConnectionId: res.Item.hostConnectionId.S!,
        hostUsername: res.Item.hostUsername?.S || '',
        joinerConnectionId: res.Item.joinerConnectionId?.S || '',
        joinerUsername: res.Item.joinerUsername?.S || '',
        status: (res.Item.status?.S || 'waiting') as LobbyRecord['status'],
    };
}

async function listOpenLobbies(): Promise<LobbyListEntry[]> {
    const res = await dynamo.send(
        new ScanCommand({
            TableName: LOBBIES_TABLE,
            FilterExpression: '#s = :waiting',
            ExpressionAttributeNames: { '#s': 'status' },
            ExpressionAttributeValues: { ':waiting': { S: 'waiting' } },
        }),
    );
    const items = res.Items || [];

    // Validate host connections still exist; clean up stale lobbies lazily.
    const results: LobbyListEntry[] = [];
    for (const item of items) {
        const hostConnId = item.hostConnectionId?.S || '';
        const conn = hostConnId ? await getConnection(hostConnId) : null;
        if (conn) {
            results.push({
                lobbyId: item.lobbyId.S!,
                hostUsername: item.hostUsername?.S || 'Unknown',
            });
        } else {
            // Host connection gone — remove orphaned lobby
            await removeLobby(item.lobbyId.S!);
        }
    }
    return results;
}

/** Remove any lobbies owned by a connection that is disconnecting. */
async function cleanupLobbiesForConnection(
    connectionId: string,
): Promise<void> {
    const res = await dynamo.send(
        new ScanCommand({
            TableName: LOBBIES_TABLE,
            FilterExpression: 'hostConnectionId = :cid',
            ExpressionAttributeValues: { ':cid': { S: connectionId } },
        }),
    );
    for (const item of res.Items || []) {
        await removeLobby(item.lobbyId.S!);
    }
}

async function joinLobby(
    lobbyId: string,
    joinerConnectionId: string,
    joinerUsername: string,
): Promise<JoinResult> {
    const lobby = await getLobby(lobbyId);
    if (!lobby) return { ok: false, reason: 'Lobby not found' };
    if (lobby.status !== 'waiting')
        return { ok: false, reason: 'Lobby is no longer available' };

    await dynamo.send(
        new PutItemCommand({
            TableName: LOBBIES_TABLE,
            Item: {
                lobbyId: { S: lobbyId },
                hostConnectionId: { S: lobby.hostConnectionId },
                hostUsername: { S: lobby.hostUsername },
                joinerConnectionId: { S: joinerConnectionId },
                joinerUsername: { S: joinerUsername },
                status: { S: 'paired' },
                expiresAt: { N: ttl() },
            },
        }),
    );

    await updateConnection(joinerConnectionId, { lobbyId, role: 'joiner' });

    return { ok: true, lobby };
}

async function removeLobby(lobbyId: string): Promise<void> {
    await dynamo.send(
        new DeleteItemCommand({
            TableName: LOBBIES_TABLE,
            Key: { lobbyId: { S: lobbyId } },
        }),
    );
}

/** Write a lobby item back to DynamoDB in "waiting" state (clear joiner). */
async function revertLobbyToWaiting(lobby: LobbyRecord): Promise<void> {
    await dynamo.send(
        new PutItemCommand({
            TableName: LOBBIES_TABLE,
            Item: {
                lobbyId: { S: lobby.lobbyId },
                hostConnectionId: { S: lobby.hostConnectionId },
                hostUsername: { S: lobby.hostUsername },
                joinerConnectionId: { S: '' },
                joinerUsername: { S: '' },
                status: { S: 'waiting' },
                expiresAt: { N: ttl() },
            },
        }),
    );
}

// ---------------------------------------------------------------------------
// ICE server credentials (TURN relay via Kinesis Video Streams)
// ---------------------------------------------------------------------------

const kinesisVideo = new KinesisVideoClient({});

/**
 * Fetch temporary TURN relay credentials from Kinesis Video Streams.
 *
 * 1. GetSignalingChannelEndpoint to discover the HTTPS endpoint.
 * 2. GetIceServerConfig to obtain time-limited TURN credentials.
 *
 * @returns An array of RTCIceServer-compatible entries (STUN + TURN).
 */
async function getIceServers(): Promise<
    Array<{ urls: string | string[]; username?: string; credential?: string }>
> {
    // Step 1: Get the HTTPS endpoint for the signaling channel
    const endpointRes = await kinesisVideo.send(
        new GetSignalingChannelEndpointCommand({
            ChannelARN: KVS_CHANNEL_ARN,
            SingleMasterChannelEndpointConfiguration: {
                Protocols: [ChannelProtocol.HTTPS],
                Role: 'MASTER',
            } as SingleMasterChannelEndpointConfiguration,
        }),
    );

    const httpsEndpoint = endpointRes.ResourceEndpointList?.find(
        (e) => e.Protocol === 'HTTPS',
    )?.ResourceEndpoint;

    if (!httpsEndpoint) {
        throw new Error('No HTTPS endpoint returned for KVS signaling channel');
    }

    // Step 2: Fetch ICE server config (TURN credentials)
    const signalingClient = new KinesisVideoSignalingClient({
        endpoint: httpsEndpoint,
    });

    const iceRes = await signalingClient.send(
        new GetIceServerConfigCommand({
            ChannelARN: KVS_CHANNEL_ARN,
        }),
    );

    const servers: Array<{
        urls: string | string[];
        username?: string;
        credential?: string;
    }> = [];

    for (const entry of iceRes.IceServerList ?? []) {
        if (entry.Uris && entry.Uris.length > 0) {
            servers.push({
                urls: entry.Uris,
                username: entry.Username,
                credential: entry.Password,
            });
        }
    }

    return servers;
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

async function handleConnect(event: WebSocketEvent): Promise<LambdaResponse> {
    const connectionId = event.requestContext.connectionId;
    await saveConnection(connectionId);
    return { statusCode: 200, body: 'Connected' };
}

async function handleDisconnect(
    event: WebSocketEvent,
): Promise<LambdaResponse> {
    const connectionId = event.requestContext.connectionId;
    const conn = await getConnection(connectionId);

    if (conn && conn.lobbyId) {
        const lobby = await getLobby(conn.lobbyId);
        if (lobby) {
            const apigw = getApigwClient(event);

            if (conn.role === 'host') {
                if (lobby.joinerConnectionId) {
                    await send(apigw, lobby.joinerConnectionId, {
                        type: 'peer-disconnected',
                    });
                    await updateConnection(lobby.joinerConnectionId, {
                        lobbyId: '',
                        role: '',
                    });
                }
                await removeLobby(conn.lobbyId);
            } else if (conn.role === 'joiner') {
                if (lobby.hostConnectionId) {
                    await send(apigw, lobby.hostConnectionId, {
                        type: 'peer-disconnected',
                    });
                }
                await revertLobbyToWaiting(lobby);
            }
        }
    } else {
        // Connection record already gone (TTL or 410 cleanup) — scan for
        // orphaned lobbies owned by this connection and remove them.
        await cleanupLobbiesForConnection(connectionId);
    }

    await removeConnection(connectionId);
    return { statusCode: 200, body: 'Disconnected' };
}

async function handleDefault(event: WebSocketEvent): Promise<LambdaResponse> {
    const connectionId = event.requestContext.connectionId;
    const apigw = getApigwClient(event);

    let body: { action: string; [key: string]: unknown };
    try {
        body = JSON.parse(event.body!);
    } catch {
        await send(apigw, connectionId, {
            type: 'error',
            message: 'Invalid JSON',
        });
        return { statusCode: 400, body: 'Invalid JSON' };
    }

    const { action } = body;

    switch (action) {
        case 'create-lobby': {
            const username = String(body.username || 'Unknown').slice(0, 24);
            const lobbyId = await createLobby(connectionId, username);
            await send(apigw, connectionId, {
                type: 'lobby-created',
                lobbyId,
            });
            break;
        }

        case 'list-lobbies': {
            const lobbies = await listOpenLobbies();
            await send(apigw, connectionId, { type: 'lobby-list', lobbies });
            break;
        }

        case 'join-lobby': {
            const username = String(body.username || 'Unknown').slice(0, 24);
            const result = await joinLobby(
                body.lobbyId as string,
                connectionId,
                username,
            );
            if (!result.ok) {
                await send(apigw, connectionId, {
                    type: 'join-failed',
                    reason: result.reason,
                });
                break;
            }

            const lobby = result.lobby;
            await send(apigw, lobby.hostConnectionId, {
                type: 'joiner-connected',
                joinerConnectionId: connectionId,
                username,
            });
            await send(apigw, connectionId, {
                type: 'join-accepted',
                hostConnectionId: lobby.hostConnectionId,
                hostUsername: lobby.hostUsername,
            });
            break;
        }

        case 'leave-lobby': {
            const conn = await getConnection(connectionId);
            if (conn && conn.lobbyId) {
                const lobby = await getLobby(conn.lobbyId);
                if (lobby) {
                    if (conn.role === 'host') {
                        if (lobby.joinerConnectionId) {
                            await send(apigw, lobby.joinerConnectionId, {
                                type: 'peer-disconnected',
                            });
                            await updateConnection(lobby.joinerConnectionId, {
                                lobbyId: '',
                                role: '',
                            });
                        }
                        await removeLobby(conn.lobbyId);
                    } else if (conn.role === 'joiner') {
                        await send(apigw, lobby.hostConnectionId, {
                            type: 'peer-disconnected',
                        });
                        await revertLobbyToWaiting(lobby);
                    }
                }
                await updateConnection(connectionId, {
                    lobbyId: '',
                    role: '',
                });
            }
            break;
        }

        case 'signal': {
            const conn = await getConnection(connectionId);
            if (!conn || !conn.lobbyId) {
                await send(apigw, connectionId, {
                    type: 'error',
                    message: 'Not in a lobby',
                });
                break;
            }

            const lobby = await getLobby(conn.lobbyId);
            if (!lobby) {
                await send(apigw, connectionId, {
                    type: 'error',
                    message: 'Lobby not found',
                });
                break;
            }

            const targetId =
                conn.role === 'host'
                    ? lobby.joinerConnectionId
                    : lobby.hostConnectionId;

            if (targetId) {
                await send(apigw, targetId, {
                    type: 'signal',
                    data: body.data,
                    from: connectionId,
                });
            }
            break;
        }

        case 'game-start': {
            const conn = await getConnection(connectionId);
            if (!conn || !conn.lobbyId || conn.role !== 'host') {
                break;
            }

            const lobby = await getLobby(conn.lobbyId);
            if (!lobby || !lobby.joinerConnectionId) {
                break;
            }

            await send(apigw, lobby.joinerConnectionId, {
                type: 'game-start',
            });
            break;
        }

        case 'get-ice-servers': {
            try {
                const iceServers = await getIceServers();
                await send(apigw, connectionId, {
                    type: 'ice-servers',
                    iceServers,
                });
            } catch (err) {
                console.error('[ICE] Failed to fetch ICE servers:', err);
                await send(apigw, connectionId, {
                    type: 'error',
                    message: 'Failed to fetch ICE server credentials',
                });
            }
            break;
        }

        default:
            await send(apigw, connectionId, {
                type: 'error',
                message: `Unknown action: ${action}`,
            });
    }

    return { statusCode: 200, body: 'OK' };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/**
 * Lambda handler for the WebSocket API Gateway signaling server.
 *
 * @param event - API Gateway WebSocket event with route key and connection ID.
 * @returns Lambda proxy response with status code.
 */
export async function handler(event: WebSocketEvent): Promise<LambdaResponse> {
    const routeKey = event.requestContext?.routeKey;

    switch (routeKey) {
        case '$connect':
            return handleConnect(event);
        case '$disconnect':
            return handleDisconnect(event);
        case '$default':
            return handleDefault(event);
        default:
            return { statusCode: 400, body: `Unknown route: ${routeKey}` };
    }
}
