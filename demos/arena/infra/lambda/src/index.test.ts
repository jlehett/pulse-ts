/**
 * Tests for the signaling Lambda handler.
 *
 * These tests mock DynamoDB and API Gateway Management to verify the
 * signaling protocol without AWS credentials.
 */

import type { WebSocketEvent, LambdaResponse } from './types';

// ---------------------------------------------------------------------------
// Mock AWS SDK clients
// ---------------------------------------------------------------------------

const mockDynamoSend = jest.fn();
const mockApigwSend = jest.fn();

jest.mock('@aws-sdk/client-dynamodb', () => ({
    DynamoDBClient: jest.fn().mockImplementation(() => ({
        send: mockDynamoSend,
    })),
    PutItemCommand: jest
        .fn()
        .mockImplementation((params: unknown) => ({
            _type: 'PutItem',
            ...(params as object),
        })),
    GetItemCommand: jest
        .fn()
        .mockImplementation((params: unknown) => ({
            _type: 'GetItem',
            ...(params as object),
        })),
    DeleteItemCommand: jest
        .fn()
        .mockImplementation((params: unknown) => ({
            _type: 'DeleteItem',
            ...(params as object),
        })),
    ScanCommand: jest
        .fn()
        .mockImplementation((params: unknown) => ({
            _type: 'Scan',
            ...(params as object),
        })),
}));

jest.mock('@aws-sdk/client-apigatewaymanagementapi', () => ({
    ApiGatewayManagementApiClient: jest
        .fn()
        .mockImplementation(() => ({ send: mockApigwSend })),
    PostToConnectionCommand: jest
        .fn()
        .mockImplementation((params: unknown) => ({
            _type: 'PostToConnection',
            ...(params as object),
        })),
}));

// Set environment variables before importing handler
process.env.LOBBIES_TABLE = 'test-lobbies';
process.env.CONNECTIONS_TABLE = 'test-connections';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { handler } = require('./index') as {
    handler: (event: WebSocketEvent) => Promise<LambdaResponse>;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEvent(
    routeKey: WebSocketEvent['requestContext']['routeKey'],
    connectionId: string,
    body?: Record<string, unknown>,
): WebSocketEvent {
    return {
        requestContext: {
            routeKey,
            connectionId,
            domainName: 'test.execute-api.us-east-1.amazonaws.com',
            stage: 'prod',
        },
        body: body ? JSON.stringify(body) : undefined,
    };
}

/** Extract the payload sent to a specific connectionId via PostToConnection. */
function getSentMessages(connectionId: string): Record<string, unknown>[] {
    return mockApigwSend.mock.calls
        .filter(
            (call: unknown[]) =>
                (call[0] as { ConnectionId?: string })?.ConnectionId ===
                connectionId,
        )
        .map((call: unknown[]) =>
            JSON.parse((call[0] as { Data: string }).Data),
        );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
    mockDynamoSend.mockReset();
    mockApigwSend.mockReset();
    mockDynamoSend.mockResolvedValue({});
});

describe('$connect', () => {
    it('saves the connection and returns 200', async () => {
        const res = await handler(makeEvent('$connect', 'conn-1'));

        expect(res.statusCode).toBe(200);
        expect(mockDynamoSend).toHaveBeenCalledTimes(1);
        const putCall = mockDynamoSend.mock.calls[0][0] as {
            TableName: string;
            Item: { connectionId: { S: string } };
        };
        expect(putCall.TableName).toBe('test-connections');
        expect(putCall.Item.connectionId.S).toBe('conn-1');
    });
});

describe('$disconnect', () => {
    it('removes the connection', async () => {
        mockDynamoSend.mockResolvedValueOnce({
            Item: {
                connectionId: { S: 'conn-1' },
                lobbyId: { S: '' },
                role: { S: '' },
                peerId: { S: '' },
            },
        });

        const res = await handler(makeEvent('$disconnect', 'conn-1'));
        expect(res.statusCode).toBe(200);
    });

    it('cleans up lobby when host disconnects', async () => {
        mockDynamoSend.mockResolvedValueOnce({
            Item: {
                connectionId: { S: 'host-1' },
                lobbyId: { S: 'lobby-123' },
                role: { S: 'host' },
                peerId: { S: '' },
            },
        });

        mockDynamoSend.mockResolvedValueOnce({
            Item: {
                lobbyId: { S: 'lobby-123' },
                hostConnectionId: { S: 'host-1' },
                hostUsername: { S: 'Alice' },
                joinerConnectionId: { S: 'joiner-1' },
                joinerUsername: { S: 'Bob' },
                status: { S: 'paired' },
            },
        });

        const res = await handler(makeEvent('$disconnect', 'host-1'));
        expect(res.statusCode).toBe(200);

        const joinerMessages = getSentMessages('joiner-1');
        expect(joinerMessages).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ type: 'peer-disconnected' }),
            ]),
        );
    });
});

describe('create-lobby', () => {
    it('creates a lobby and responds with lobbyId', async () => {
        const res = await handler(
            makeEvent('$default', 'host-1', {
                action: 'create-lobby',
                username: 'Alice',
            }),
        );

        expect(res.statusCode).toBe(200);

        const messages = getSentMessages('host-1');
        expect(messages).toHaveLength(1);
        expect(messages[0].type).toBe('lobby-created');
        expect(messages[0].lobbyId).toMatch(/^lobby-/);
    });

    it('truncates long usernames', async () => {
        await handler(
            makeEvent('$default', 'host-1', {
                action: 'create-lobby',
                username: 'A'.repeat(50),
            }),
        );

        const lobbyCalls = mockDynamoSend.mock.calls.filter(
            (c: unknown[]) =>
                (c[0] as { TableName?: string }).TableName === 'test-lobbies',
        );
        expect(lobbyCalls.length).toBeGreaterThan(0);
        const hostUsername = (
            lobbyCalls[0][0] as {
                Item: { hostUsername: { S: string } };
            }
        ).Item.hostUsername.S;
        expect(hostUsername.length).toBeLessThanOrEqual(24);
    });
});

describe('list-lobbies', () => {
    it('returns open lobbies', async () => {
        mockDynamoSend.mockResolvedValueOnce({
            Items: [
                {
                    lobbyId: { S: 'lobby-1' },
                    hostUsername: { S: 'Alice' },
                    status: { S: 'waiting' },
                },
                {
                    lobbyId: { S: 'lobby-2' },
                    hostUsername: { S: 'Bob' },
                    status: { S: 'waiting' },
                },
            ],
        });

        await handler(
            makeEvent('$default', 'conn-1', { action: 'list-lobbies' }),
        );

        const messages = getSentMessages('conn-1');
        expect(messages).toHaveLength(1);
        expect(messages[0].type).toBe('lobby-list');
        expect(messages[0].lobbies).toHaveLength(2);
        expect((messages[0].lobbies as unknown[])[0]).toEqual({
            lobbyId: 'lobby-1',
            hostUsername: 'Alice',
        });
    });
});

describe('join-lobby', () => {
    it('pairs joiner with host and notifies both', async () => {
        mockDynamoSend.mockResolvedValueOnce({
            Item: {
                lobbyId: { S: 'lobby-1' },
                hostConnectionId: { S: 'host-1' },
                hostUsername: { S: 'Alice' },
                joinerConnectionId: { S: '' },
                joinerUsername: { S: '' },
                status: { S: 'waiting' },
            },
        });

        await handler(
            makeEvent('$default', 'joiner-1', {
                action: 'join-lobby',
                lobbyId: 'lobby-1',
                username: 'Bob',
            }),
        );

        const hostMsgs = getSentMessages('host-1');
        expect(hostMsgs).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: 'joiner-connected',
                    username: 'Bob',
                }),
            ]),
        );

        const joinerMsgs = getSentMessages('joiner-1');
        expect(joinerMsgs).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: 'join-accepted',
                    hostUsername: 'Alice',
                }),
            ]),
        );
    });

    it('rejects joining a non-existent lobby', async () => {
        mockDynamoSend.mockResolvedValueOnce({});

        await handler(
            makeEvent('$default', 'joiner-1', {
                action: 'join-lobby',
                lobbyId: 'nonexistent',
                username: 'Bob',
            }),
        );

        const messages = getSentMessages('joiner-1');
        expect(messages).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ type: 'join-failed' }),
            ]),
        );
    });
});

describe('signal relay', () => {
    it('relays signal from host to joiner', async () => {
        mockDynamoSend.mockResolvedValueOnce({
            Item: {
                connectionId: { S: 'host-1' },
                lobbyId: { S: 'lobby-1' },
                role: { S: 'host' },
                peerId: { S: '' },
            },
        });

        mockDynamoSend.mockResolvedValueOnce({
            Item: {
                lobbyId: { S: 'lobby-1' },
                hostConnectionId: { S: 'host-1' },
                hostUsername: { S: 'Alice' },
                joinerConnectionId: { S: 'joiner-1' },
                joinerUsername: { S: 'Bob' },
                status: { S: 'paired' },
            },
        });

        const sdpOffer = { type: 'offer', sdp: 'v=0...' };
        await handler(
            makeEvent('$default', 'host-1', {
                action: 'signal',
                data: sdpOffer,
            }),
        );

        const joinerMsgs = getSentMessages('joiner-1');
        expect(joinerMsgs).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: 'signal',
                    data: sdpOffer,
                    from: 'host-1',
                }),
            ]),
        );
    });

    it('returns error when not in a lobby', async () => {
        mockDynamoSend.mockResolvedValueOnce({
            Item: {
                connectionId: { S: 'conn-1' },
                lobbyId: { S: '' },
                role: { S: '' },
                peerId: { S: '' },
            },
        });

        await handler(
            makeEvent('$default', 'conn-1', {
                action: 'signal',
                data: { type: 'offer' },
            }),
        );

        const messages = getSentMessages('conn-1');
        expect(messages).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: 'error',
                    message: 'Not in a lobby',
                }),
            ]),
        );
    });
});

describe('game-start', () => {
    it('relays game-start from host to joiner', async () => {
        mockDynamoSend.mockResolvedValueOnce({
            Item: {
                connectionId: { S: 'host-1' },
                lobbyId: { S: 'lobby-1' },
                role: { S: 'host' },
                peerId: { S: '' },
            },
        });

        mockDynamoSend.mockResolvedValueOnce({
            Item: {
                lobbyId: { S: 'lobby-1' },
                hostConnectionId: { S: 'host-1' },
                hostUsername: { S: 'Alice' },
                joinerConnectionId: { S: 'joiner-1' },
                joinerUsername: { S: 'Bob' },
                status: { S: 'paired' },
            },
        });

        await handler(
            makeEvent('$default', 'host-1', { action: 'game-start' }),
        );

        const joinerMsgs = getSentMessages('joiner-1');
        expect(joinerMsgs).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ type: 'game-start' }),
            ]),
        );
    });
});

describe('invalid messages', () => {
    it('returns error for invalid JSON', async () => {
        const event = makeEvent('$default', 'conn-1');
        (event as { body: string }).body = 'not json{{{';

        const res = await handler(event);
        expect(res.statusCode).toBe(400);

        const messages = getSentMessages('conn-1');
        expect(messages).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: 'error',
                    message: 'Invalid JSON',
                }),
            ]),
        );
    });

    it('returns error for unknown action', async () => {
        await handler(
            makeEvent('$default', 'conn-1', { action: 'bogus' }),
        );

        const messages = getSentMessages('conn-1');
        expect(messages).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ type: 'error' }),
            ]),
        );
    });
});
