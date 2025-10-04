[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / attachWsServer

# Function: attachWsServer()

> **attachWsServer**(`wss`, `opts?`): [`NetworkServer`](../classes/NetworkServer.md)

Defined in: [packages/network/src/server/ws.ts:23](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/server/ws.ts#L23)

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
