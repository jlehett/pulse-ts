/**
 * Type definitions for the signaling Lambda protocol,
 * DynamoDB items, and API Gateway WebSocket events.
 */

// ---------------------------------------------------------------------------
// API Gateway WebSocket event types
// ---------------------------------------------------------------------------

/** Request context from an API Gateway WebSocket event. */
export interface WebSocketRequestContext {
    routeKey: '$connect' | '$disconnect' | '$default';
    connectionId: string;
    domainName: string;
    stage: string;
}

/** API Gateway WebSocket event passed to the Lambda handler. */
export interface WebSocketEvent {
    requestContext: WebSocketRequestContext;
    body?: string;
}

/** Standard Lambda proxy response. */
export interface LambdaResponse {
    statusCode: number;
    body: string;
}

// ---------------------------------------------------------------------------
// Client → Server messages
// ---------------------------------------------------------------------------

export interface CreateLobbyMessage {
    action: 'create-lobby';
    username: string;
    version?: string;
}

export interface ListLobbiesMessage {
    action: 'list-lobbies';
}

export interface JoinLobbyMessage {
    action: 'join-lobby';
    lobbyId: string;
    username: string;
    version?: string;
}

export interface LeaveLobbyMessage {
    action: 'leave-lobby';
}

export interface SignalMessage {
    action: 'signal';
    data: unknown;
}

export interface GameStartMessage {
    action: 'game-start';
}

export interface GetIceServersMessage {
    action: 'get-ice-servers';
}

export type ClientMessage =
    | CreateLobbyMessage
    | ListLobbiesMessage
    | JoinLobbyMessage
    | LeaveLobbyMessage
    | SignalMessage
    | GameStartMessage
    | GetIceServersMessage;

// ---------------------------------------------------------------------------
// Server → Client messages
// ---------------------------------------------------------------------------

export interface LobbyCreatedResponse {
    type: 'lobby-created';
    lobbyId: string;
}

export interface LobbyListEntry {
    lobbyId: string;
    hostUsername: string;
}

export interface LobbyListResponse {
    type: 'lobby-list';
    lobbies: LobbyListEntry[];
}

export interface JoinerConnectedResponse {
    type: 'joiner-connected';
    joinerConnectionId: string;
    username: string;
    version?: string;
}

export interface JoinAcceptedResponse {
    type: 'join-accepted';
    hostConnectionId: string;
    hostUsername: string;
    version?: string;
}

export interface JoinFailedResponse {
    type: 'join-failed';
    reason: string;
}

export interface SignalRelayResponse {
    type: 'signal';
    data: unknown;
    from: string;
}

export interface GameStartResponse {
    type: 'game-start';
}

export interface PeerDisconnectedResponse {
    type: 'peer-disconnected';
}

export interface IceServersResponse {
    type: 'ice-servers';
    iceServers: Array<{
        urls: string | string[];
        username?: string;
        credential?: string;
    }>;
}

export interface ErrorResponse {
    type: 'error';
    message: string;
}

export type ServerMessage =
    | LobbyCreatedResponse
    | LobbyListResponse
    | JoinerConnectedResponse
    | JoinAcceptedResponse
    | JoinFailedResponse
    | SignalRelayResponse
    | GameStartResponse
    | PeerDisconnectedResponse
    | IceServersResponse
    | ErrorResponse;

// ---------------------------------------------------------------------------
// DynamoDB item shapes (application-level, not raw AttributeValue)
// ---------------------------------------------------------------------------

/** Parsed connection record from the connections table. */
export interface ConnectionRecord {
    connectionId: string;
    lobbyId: string;
    role: 'host' | 'joiner' | '';
    peerId: string;
}

/** Parsed lobby record from the lobbies table. */
export interface LobbyRecord {
    lobbyId: string;
    hostConnectionId: string;
    hostUsername: string;
    hostVersion: string;
    joinerConnectionId: string;
    joinerUsername: string;
    status: 'waiting' | 'paired';
}

/** Result of attempting to join a lobby. */
export type JoinResult =
    | { ok: true; lobby: LobbyRecord }
    | { ok: false; reason: string };
