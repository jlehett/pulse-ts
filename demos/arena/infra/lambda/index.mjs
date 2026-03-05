/**
 * Signaling server Lambda handler for arena online play.
 *
 * Handles WebSocket API Gateway routes ($connect, $disconnect, $default)
 * for lobby management and WebRTC signaling relay.
 *
 * Message protocol (JSON over WebSocket):
 *
 * Client → Server:
 *   { action: "create-lobby", username: string }
 *   { action: "list-lobbies" }
 *   { action: "join-lobby", lobbyId: string, username: string }
 *   { action: "leave-lobby" }
 *   { action: "signal", data: RTCSessionDescription | RTCIceCandidate }
 *   { action: "game-start" }
 *
 * Server → Client:
 *   { type: "lobby-created", lobbyId: string }
 *   { type: "lobby-list", lobbies: Array<{ lobbyId, hostUsername }> }
 *   { type: "joiner-connected", joinerConnectionId: string, username: string }
 *   { type: "join-accepted", hostConnectionId: string, hostUsername: string }
 *   { type: "join-failed", reason: string }
 *   { type: "signal", data: any, from: string }
 *   { type: "game-start" }
 *   { type: "peer-disconnected" }
 *   { type: "error", message: string }
 */

import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  DeleteItemCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from '@aws-sdk/client-apigatewaymanagementapi';

const dynamo = new DynamoDBClient({});

const LOBBIES_TABLE = process.env.LOBBIES_TABLE;
const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE;

/** TTL for lobbies and connections: 1 hour. */
const TTL_SECONDS = 3600;

/**
 * Build the API Gateway management client from the event context.
 *
 * @param {object} event - API Gateway WebSocket event.
 * @returns {ApiGatewayManagementApiClient}
 */
function getApigwClient(event) {
  const { domainName, stage } = event.requestContext;
  return new ApiGatewayManagementApiClient({
    endpoint: `https://${domainName}/${stage}`,
  });
}

/**
 * Send a JSON message to a specific WebSocket connection.
 *
 * @param {ApiGatewayManagementApiClient} apigw
 * @param {string} connectionId
 * @param {object} payload
 */
async function send(apigw, connectionId, payload) {
  try {
    await apigw.send(
      new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: JSON.stringify(payload),
      }),
    );
  } catch (err) {
    if (err.statusCode === 410) {
      // Connection is stale — clean up
      await removeConnection(connectionId);
    }
  }
}

// ---------------------------------------------------------------------------
// Connection tracking
// ---------------------------------------------------------------------------

async function saveConnection(connectionId) {
  await dynamo.send(
    new PutItemCommand({
      TableName: CONNECTIONS_TABLE,
      Item: {
        connectionId: { S: connectionId },
        lobbyId: { S: '' },
        role: { S: '' },
        peerId: { S: '' },
        expiresAt: { N: String(Math.floor(Date.now() / 1000) + TTL_SECONDS) },
      },
    }),
  );
}

async function getConnection(connectionId) {
  const res = await dynamo.send(
    new GetItemCommand({
      TableName: CONNECTIONS_TABLE,
      Key: { connectionId: { S: connectionId } },
    }),
  );
  if (!res.Item) return null;
  return {
    connectionId: res.Item.connectionId.S,
    lobbyId: res.Item.lobbyId?.S || '',
    role: res.Item.role?.S || '',
    peerId: res.Item.peerId?.S || '',
  };
}

async function updateConnection(connectionId, fields) {
  const item = {
    connectionId: { S: connectionId },
    expiresAt: { N: String(Math.floor(Date.now() / 1000) + TTL_SECONDS) },
  };
  for (const [k, v] of Object.entries(fields)) {
    item[k] = { S: String(v) };
  }
  await dynamo.send(
    new PutItemCommand({ TableName: CONNECTIONS_TABLE, Item: item }),
  );
}

async function removeConnection(connectionId) {
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

async function createLobby(connectionId, username) {
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
        expiresAt: { N: String(Math.floor(Date.now() / 1000) + TTL_SECONDS) },
      },
    }),
  );
  await updateConnection(connectionId, { lobbyId, role: 'host' });
  return lobbyId;
}

async function getLobby(lobbyId) {
  const res = await dynamo.send(
    new GetItemCommand({
      TableName: LOBBIES_TABLE,
      Key: { lobbyId: { S: lobbyId } },
    }),
  );
  if (!res.Item) return null;
  return {
    lobbyId: res.Item.lobbyId.S,
    hostConnectionId: res.Item.hostConnectionId.S,
    hostUsername: res.Item.hostUsername?.S || '',
    joinerConnectionId: res.Item.joinerConnectionId?.S || '',
    joinerUsername: res.Item.joinerUsername?.S || '',
    status: res.Item.status?.S || 'waiting',
  };
}

async function listOpenLobbies() {
  const res = await dynamo.send(
    new ScanCommand({
      TableName: LOBBIES_TABLE,
      FilterExpression: '#s = :waiting',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':waiting': { S: 'waiting' } },
    }),
  );
  return (res.Items || []).map((item) => ({
    lobbyId: item.lobbyId.S,
    hostUsername: item.hostUsername?.S || 'Unknown',
  }));
}

async function joinLobby(lobbyId, joinerConnectionId, joinerUsername) {
  const lobby = await getLobby(lobbyId);
  if (!lobby) return { ok: false, reason: 'Lobby not found' };
  if (lobby.status !== 'waiting')
    return { ok: false, reason: 'Lobby is no longer available' };

  // Mark lobby as paired
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
        expiresAt: { N: String(Math.floor(Date.now() / 1000) + TTL_SECONDS) },
      },
    }),
  );

  await updateConnection(joinerConnectionId, { lobbyId, role: 'joiner' });

  return { ok: true, lobby };
}

async function removeLobby(lobbyId) {
  await dynamo.send(
    new DeleteItemCommand({
      TableName: LOBBIES_TABLE,
      Key: { lobbyId: { S: lobbyId } },
    }),
  );
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

async function handleConnect(event) {
  const connectionId = event.requestContext.connectionId;
  await saveConnection(connectionId);
  return { statusCode: 200, body: 'Connected' };
}

async function handleDisconnect(event) {
  const connectionId = event.requestContext.connectionId;
  const conn = await getConnection(connectionId);

  if (conn && conn.lobbyId) {
    const lobby = await getLobby(conn.lobbyId);
    if (lobby) {
      const apigw = getApigwClient(event);

      if (conn.role === 'host') {
        // Host disconnected — notify joiner and remove lobby
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
        // Joiner disconnected — notify host and reopen lobby
        if (lobby.hostConnectionId) {
          await send(apigw, lobby.hostConnectionId, {
            type: 'peer-disconnected',
          });
        }
        // Revert lobby to waiting
        await dynamo.send(
          new PutItemCommand({
            TableName: LOBBIES_TABLE,
            Item: {
              lobbyId: { S: conn.lobbyId },
              hostConnectionId: { S: lobby.hostConnectionId },
              hostUsername: { S: lobby.hostUsername },
              joinerConnectionId: { S: '' },
              joinerUsername: { S: '' },
              status: { S: 'waiting' },
              expiresAt: {
                N: String(Math.floor(Date.now() / 1000) + TTL_SECONDS),
              },
            },
          }),
        );
      }
    }
  }

  await removeConnection(connectionId);
  return { statusCode: 200, body: 'Disconnected' };
}

async function handleDefault(event) {
  const connectionId = event.requestContext.connectionId;
  const apigw = getApigwClient(event);

  let body;
  try {
    body = JSON.parse(event.body);
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
      await send(apigw, connectionId, { type: 'lobby-created', lobbyId });
      break;
    }

    case 'list-lobbies': {
      const lobbies = await listOpenLobbies();
      await send(apigw, connectionId, { type: 'lobby-list', lobbies });
      break;
    }

    case 'join-lobby': {
      const username = String(body.username || 'Unknown').slice(0, 24);
      const result = await joinLobby(body.lobbyId, connectionId, username);
      if (!result.ok) {
        await send(apigw, connectionId, {
          type: 'join-failed',
          reason: result.reason,
        });
        break;
      }

      const lobby = result.lobby;
      // Notify the host that a joiner connected
      await send(apigw, lobby.hostConnectionId, {
        type: 'joiner-connected',
        joinerConnectionId: connectionId,
        username,
      });
      // Notify the joiner with host info
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
            // Revert lobby to waiting
            await dynamo.send(
              new PutItemCommand({
                TableName: LOBBIES_TABLE,
                Item: {
                  lobbyId: { S: conn.lobbyId },
                  hostConnectionId: { S: lobby.hostConnectionId },
                  hostUsername: { S: lobby.hostUsername },
                  joinerConnectionId: { S: '' },
                  joinerUsername: { S: '' },
                  status: { S: 'waiting' },
                  expiresAt: {
                    N: String(Math.floor(Date.now() / 1000) + TTL_SECONDS),
                  },
                },
              }),
            );
          }
        }
        await updateConnection(connectionId, { lobbyId: '', role: '' });
      }
      break;
    }

    case 'signal': {
      // Relay WebRTC signaling data to the peer
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

      // Determine peer to relay to
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
      // Host tells joiner the game is starting
      const conn = await getConnection(connectionId);
      if (!conn || !conn.lobbyId || conn.role !== 'host') break;

      const lobby = await getLobby(conn.lobbyId);
      if (!lobby || !lobby.joinerConnectionId) break;

      await send(apigw, lobby.joinerConnectionId, { type: 'game-start' });
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

export async function handler(event) {
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
