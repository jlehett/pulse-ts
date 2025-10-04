[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / WebSocketTransport

# Class: WebSocketTransport

Defined in: [packages/network/src/transports/websocket/transport.ts:27](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/network/src/transports/websocket/transport.ts#L27)

WebSocket-based transport for browser/Node (pass a ctor for Node).

Usage:
- Browser: `new WebSocketTransport('wss://...', { autoReconnect: true })`
- Node: `new WebSocketTransport(url, { ws: require('ws') })`

## Implements

- [`Transport`](../interfaces/Transport.md)

## Constructors

### Constructor

> **new WebSocketTransport**(`url`, `opts`): `WebSocketTransport`

Defined in: [packages/network/src/transports/websocket/transport.ts:39](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/network/src/transports/websocket/transport.ts#L39)

#### Parameters

##### url

`string`

##### opts

###### autoReconnect?

`boolean`

Enable simple exponential backoff auto-reconnect.

###### backoff?

\{ `factor?`: `number`; `initialMs?`: `number`; `maxMs?`: `number`; \}

Backoff options in milliseconds.

###### backoff.factor?

`number`

###### backoff.initialMs?

`number`

###### backoff.maxMs?

`number`

###### protocols?

`string` \| `string`[]

###### ws?

`WebSocketCtor`

Provide a WebSocket constructor for Node environments.

#### Returns

`WebSocketTransport`

## Properties

### kind

> `readonly` **kind**: `"ws"` = `'ws'`

Defined in: [packages/network/src/transports/websocket/transport.ts:28](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/network/src/transports/websocket/transport.ts#L28)

The kind of transport.

#### Implementation of

[`Transport`](../interfaces/Transport.md).[`kind`](../interfaces/Transport.md#kind)

***

### supportsBinary

> `readonly` **supportsBinary**: `true` = `true`

Defined in: [packages/network/src/transports/websocket/transport.ts:29](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/network/src/transports/websocket/transport.ts#L29)

Whether the transport supports binary.

#### Implementation of

[`Transport`](../interfaces/Transport.md).[`supportsBinary`](../interfaces/Transport.md#supportsbinary)

## Methods

### connect()

> **connect**(): `Promise`\<`void`\>

Defined in: [packages/network/src/transports/websocket/transport.ts:58](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/network/src/transports/websocket/transport.ts#L58)

Establishes the WebSocket connection.

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`Transport`](../interfaces/Transport.md).[`connect`](../interfaces/Transport.md#connect)

***

### disconnect()

> **disconnect**(`code?`, `reason?`): `Promise`\<`void`\>

Defined in: [packages/network/src/transports/websocket/transport.ts:88](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/network/src/transports/websocket/transport.ts#L88)

Closes the connection and cancels reconnect attempts.

#### Parameters

##### code?

`number`

##### reason?

`string`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`Transport`](../interfaces/Transport.md).[`disconnect`](../interfaces/Transport.md#disconnect)

***

### getStatus()

> **getStatus**(): [`TransportStatus`](../type-aliases/TransportStatus.md)

Defined in: [packages/network/src/transports/websocket/transport.ts:53](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/network/src/transports/websocket/transport.ts#L53)

Current connection status.

#### Returns

[`TransportStatus`](../type-aliases/TransportStatus.md)

#### Implementation of

[`Transport`](../interfaces/Transport.md).[`getStatus`](../interfaces/Transport.md#getstatus)

***

### onMessage()

> **onMessage**(`fn`): () => `boolean`

Defined in: [packages/network/src/transports/websocket/transport.ts:117](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/network/src/transports/websocket/transport.ts#L117)

Subscribes to raw incoming frames.

#### Parameters

##### fn

(`data`, `meta?`) => `void`

#### Returns

> (): `boolean`

##### Returns

`boolean`

#### Implementation of

[`Transport`](../interfaces/Transport.md).[`onMessage`](../interfaces/Transport.md#onmessage)

***

### onStatus()

> **onStatus**(`fn`): () => `boolean`

Defined in: [packages/network/src/transports/websocket/transport.ts:123](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/network/src/transports/websocket/transport.ts#L123)

Subscribes to status changes.

#### Parameters

##### fn

(`status`) => `void`

#### Returns

> (): `boolean`

##### Returns

`boolean`

#### Implementation of

[`Transport`](../interfaces/Transport.md).[`onStatus`](../interfaces/Transport.md#onstatus)

***

### send()

> **send**(`data`): `void`

Defined in: [packages/network/src/transports/websocket/transport.ts:99](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/network/src/transports/websocket/transport.ts#L99)

Sends a binary frame over the WebSocket.

#### Parameters

##### data

`Uint8Array`

#### Returns

`void`

#### Implementation of

[`Transport`](../interfaces/Transport.md).[`send`](../interfaces/Transport.md#send)
