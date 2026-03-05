/**
 * Tests for the signaling Lambda handler.
 *
 * Run with: node --experimental-vm-modules node_modules/.bin/jest demos/arena/infra/lambda/index.test.mjs
 * Or: npm test -- --testPathPattern=infra/lambda
 *
 * These tests mock DynamoDB and API Gateway Management to verify the
 * signaling protocol without AWS credentials.
 */

import { jest } from '@jest/globals';

// ---------------------------------------------------------------------------
// Mock AWS SDK clients
// ---------------------------------------------------------------------------

const mockDynamoSend = jest.fn();
const mockApigwSend = jest.fn();

jest.unstable_mockModule('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({ send: mockDynamoSend })),
  PutItemCommand: jest.fn().mockImplementation((params) => ({ _type: 'PutItem', ...params })),
  GetItemCommand: jest.fn().mockImplementation((params) => ({ _type: 'GetItem', ...params })),
  DeleteItemCommand: jest.fn().mockImplementation((params) => ({ _type: 'DeleteItem', ...params })),
  ScanCommand: jest.fn().mockImplementation((params) => ({ _type: 'Scan', ...params })),
}));

jest.unstable_mockModule('@aws-sdk/client-apigatewaymanagementapi', () => ({
  ApiGatewayManagementApiClient: jest.fn().mockImplementation(() => ({ send: mockApigwSend })),
  PostToConnectionCommand: jest.fn().mockImplementation((params) => ({ _type: 'PostToConnection', ...params })),
}));

// Set environment variables before importing handler
process.env.LOBBIES_TABLE = 'test-lobbies';
process.env.CONNECTIONS_TABLE = 'test-connections';

const { handler } = await import('./index.mjs');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEvent(routeKey, connectionId, body) {
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
function getSentMessages(connectionId) {
  return mockApigwSend.mock.calls
    .filter((call) => call[0]?.ConnectionId === connectionId)
    .map((call) => JSON.parse(call[0].Data));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  mockDynamoSend.mockReset();
  mockApigwSend.mockReset();
  // Default: DynamoDB returns empty for gets, succeeds for writes
  mockDynamoSend.mockResolvedValue({});
});

describe('$connect', () => {
  it('saves the connection and returns 200', async () => {
    const res = await handler(makeEvent('$connect', 'conn-1'));

    expect(res.statusCode).toBe(200);
    expect(mockDynamoSend).toHaveBeenCalledTimes(1);
    const putCall = mockDynamoSend.mock.calls[0][0];
    expect(putCall.TableName).toBe('test-connections');
    expect(putCall.Item.connectionId.S).toBe('conn-1');
  });
});

describe('$disconnect', () => {
  it('removes the connection', async () => {
    // Connection exists but not in a lobby
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
    // GetItem for connection
    mockDynamoSend.mockResolvedValueOnce({
      Item: {
        connectionId: { S: 'host-1' },
        lobbyId: { S: 'lobby-123' },
        role: { S: 'host' },
        peerId: { S: '' },
      },
    });

    // GetItem for lobby
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

    // Should have notified joiner of disconnection
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

    // Should have sent lobby-created message
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

    // Check the PutItem call for the lobby
    const lobbyCalls = mockDynamoSend.mock.calls.filter(
      (c) => c[0].TableName === 'test-lobbies',
    );
    expect(lobbyCalls.length).toBeGreaterThan(0);
    const hostUsername = lobbyCalls[0][0].Item.hostUsername.S;
    expect(hostUsername.length).toBeLessThanOrEqual(24);
  });
});

describe('list-lobbies', () => {
  it('returns open lobbies', async () => {
    // DynamoDB scan returns lobbies
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
    expect(messages[0].lobbies[0]).toEqual({
      lobbyId: 'lobby-1',
      hostUsername: 'Alice',
    });
  });
});

describe('join-lobby', () => {
  it('pairs joiner with host and notifies both', async () => {
    // GetItem for lobby
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

    // Host should receive joiner-connected
    const hostMsgs = getSentMessages('host-1');
    expect(hostMsgs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'joiner-connected',
          username: 'Bob',
        }),
      ]),
    );

    // Joiner should receive join-accepted
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
    mockDynamoSend.mockResolvedValueOnce({}); // No Item

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
    // GetItem for connection
    mockDynamoSend.mockResolvedValueOnce({
      Item: {
        connectionId: { S: 'host-1' },
        lobbyId: { S: 'lobby-1' },
        role: { S: 'host' },
        peerId: { S: '' },
      },
    });

    // GetItem for lobby
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
        expect.objectContaining({ type: 'error', message: 'Not in a lobby' }),
      ]),
    );
  });
});

describe('game-start', () => {
  it('relays game-start from host to joiner', async () => {
    // GetItem for connection
    mockDynamoSend.mockResolvedValueOnce({
      Item: {
        connectionId: { S: 'host-1' },
        lobbyId: { S: 'lobby-1' },
        role: { S: 'host' },
        peerId: { S: '' },
      },
    });

    // GetItem for lobby
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
    event.body = 'not json{{{';

    const res = await handler(event);
    expect(res.statusCode).toBe(400);

    const messages = getSentMessages('conn-1');
    expect(messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'error', message: 'Invalid JSON' }),
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
