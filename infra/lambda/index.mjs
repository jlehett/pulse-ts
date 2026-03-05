/**
 * Signaling server Lambda handler.
 *
 * Handles WebSocket $connect, $disconnect, and $default routes for the
 * arena lobby and WebRTC signaling system.
 *
 * Full implementation in TICKET-094.
 */
export async function handler(event) {
  const routeKey = event.requestContext?.routeKey;
  const connectionId = event.requestContext?.connectionId;

  console.log(`Route: ${routeKey}, Connection: ${connectionId}`);

  switch (routeKey) {
    case '$connect':
      return { statusCode: 200, body: 'Connected' };

    case '$disconnect':
      return { statusCode: 200, body: 'Disconnected' };

    case '$default':
      return { statusCode: 200, body: 'OK' };

    default:
      return { statusCode: 400, body: `Unknown route: ${routeKey}` };
  }
}
