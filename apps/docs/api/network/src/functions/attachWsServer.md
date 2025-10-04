[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / attachWsServer

# Function: attachWsServer()

> **attachWsServer**(`wss`, `opts?`): [`NetworkServer`](../classes/NetworkServer.md)

Defined in: [packages/network/src/server/ws.ts:23](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/network/src/server/ws.ts#L23)

Attaches a Node 'ws' WebSocketServer to a NetworkServer.

Example:
const { WebSocketServer } = require('ws');
const wss = new WebSocketServer({ port: 8080 });
const server = attachWsServer(wss, { defaultRoom: 'lobby' });

## Parameters

### wss

`WsServer`

### opts?

#### assignId?

(`req`) => `string`

Assign a stable peer id. Defaults to incremental.

#### authorize?

(`req`) => `boolean` \| `Promise`\<`boolean`\>

Authorize a connection. Throw/return false to reject.

#### defaultRoom?

`string`

Default room to add new peers to (optional).

#### limits?

[`RateLimits`](../interfaces/RateLimits.md)

Rate limits config.

#### maxRoomsPerPeer?

`number`

Max rooms a single peer may be in (drops join beyond this).

#### onConnect?

(`peer`) => `void`

Called when a peer connects.

#### onDisconnect?

(`peerId`) => `void`

Called when a peer disconnects.

## Returns

[`NetworkServer`](../classes/NetworkServer.md)
