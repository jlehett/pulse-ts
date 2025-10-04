[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / useWebSocket

# Function: useWebSocket()

> **useWebSocket**(`url`, `opts?`): `object`

Defined in: [packages/network/src/fc/hooks.ts:78](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/network/src/fc/hooks.ts#L78)

Convenience hook: connect via WebSocketTransport.

## Parameters

### url

`string`

WebSocket URL.

### opts?

Transport options (protocols, ws ctor for Node, autoReconnect, backoff).

#### autoReconnect?

`boolean`

Enable simple exponential backoff auto-reconnect.

#### backoff?

\{ `factor?`: `number`; `initialMs?`: `number`; `maxMs?`: `number`; \}

Backoff options in milliseconds.

#### backoff.factor?

`number`

#### backoff.initialMs?

`number`

#### backoff.maxMs?

`number`

#### protocols?

`string` \| `string`[]

#### ws?

`WebSocketCtor`

Provide a WebSocket constructor for Node environments.

## Returns

### disconnect()

> `readonly` **disconnect**: () => `undefined` \| `Promise`\<`void`\>

Disconnect from the network.

#### Returns

`undefined` \| `Promise`\<`void`\>

### getStatus()

> `readonly` **getStatus**: () => [`TransportStatus`](../type-aliases/TransportStatus.md)

Get the connection status.

#### Returns

[`TransportStatus`](../type-aliases/TransportStatus.md)

The connection status.
