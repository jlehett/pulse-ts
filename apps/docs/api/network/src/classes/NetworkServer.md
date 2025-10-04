[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / NetworkServer

# Class: NetworkServer

Defined in: [packages/network/src/server/broker.ts:32](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/server/broker.ts#L32)

Minimal channel/room broker for WebSocket servers.

- Forwards channel packets to peers in the same room(s) (excluding sender).
- Handles a reserved `__room` channel with `{ action: 'join'|'leave', room }`.
- Optional RPC hosting on `__rpc` channel via registerRpc(name, handler).

## Constructors

### Constructor

> **new NetworkServer**(`opts`): `NetworkServer`

Defined in: [packages/network/src/server/broker.ts:49](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/server/broker.ts#L49)

#### Parameters

##### opts

###### assignId?

(`req`) => `string`

Assign a stable peer id. Defaults to incremental.

###### authorize?

(`req`) => `boolean` \| `Promise`\<`boolean`\>

Authorize a connection. Throw/return false to reject.

###### defaultRoom?

`string`

Default room to add new peers to (optional).

###### limits?

[`RateLimits`](../interfaces/RateLimits.md)

Rate limits config.

###### maxRoomsPerPeer?

`number`

Max rooms a single peer may be in (drops join beyond this).

###### onConnect?

(`peer`) => `void`

Called when a peer connects.

###### onDisconnect?

(`peerId`) => `void`

Called when a peer disconnects.

#### Returns

`NetworkServer`

## Methods

### attachWebSocketServer()

> **attachWebSocketServer**(`wss`): `void`

Defined in: [packages/network/src/server/broker.ts:75](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/server/broker.ts#L75)

Binds a ws server (from the 'ws' package) to this broker.

#### Parameters

##### wss

`WsServer`

#### Returns

`void`

***

### broadcast()

> **broadcast**(`packet`, `rooms?`, `exceptId?`): `void`

Defined in: [packages/network/src/server/broker.ts:165](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/server/broker.ts#L165)

Sends a packet to all peers in given room(s) except an optional excluded peer.

#### Parameters

##### packet

[`Packet`](../interfaces/Packet.md)

##### rooms?

`Iterable`\<`string`, `any`, `any`\>

##### exceptId?

`string`

#### Returns

`void`

***

### disconnect()

> **disconnect**(`peerId`, `code?`, `reason?`): `void`

Defined in: [packages/network/src/server/broker.ts:134](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/server/broker.ts#L134)

Disconnects a peer.

#### Parameters

##### peerId

`string`

##### code?

`number`

##### reason?

`string`

#### Returns

`void`

***

### joinRoom()

> **joinRoom**(`peerId`, `room`): \{ `ok`: `true`; \} \| \{ `ok`: `false`; `reason`: `"max_rooms"` \| `"unknown_peer"`; \}

Defined in: [packages/network/src/server/broker.ts:97](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/server/broker.ts#L97)

Registers a room membership.

#### Parameters

##### peerId

`string`

##### room

`string`

#### Returns

\{ `ok`: `true`; \} \| \{ `ok`: `false`; `reason`: `"max_rooms"` \| `"unknown_peer"`; \}

***

### leaveRoom()

> **leaveRoom**(`peerId`, `room`): \{ `ok`: `true`; \} \| \{ `ok`: `false`; `reason`: `"not_member"` \| `"unknown_room"`; \}

Defined in: [packages/network/src/server/broker.ts:104](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/server/broker.ts#L104)

Removes a peer from a room.

#### Parameters

##### peerId

`string`

##### room

`string`

#### Returns

\{ `ok`: `true`; \} \| \{ `ok`: `false`; `reason`: `"not_member"` \| `"unknown_room"`; \}

***

### listPeers()

> **listPeers**(): `string`[]

Defined in: [packages/network/src/server/broker.ts:129](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/server/broker.ts#L129)

Lists all peer ids.

#### Returns

`string`[]

***

### listRooms()

> **listRooms**(): `string`[]

Defined in: [packages/network/src/server/broker.ts:124](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/server/broker.ts#L124)

Lists all room names.

#### Returns

`string`[]

***

### peersInRoom()

> **peersInRoom**(`room`): `string`[]

Defined in: [packages/network/src/server/broker.ts:114](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/server/broker.ts#L114)

Lists peers currently in a room.

#### Parameters

##### room

`string`

#### Returns

`string`[]

***

### registerChannel()

> **registerChannel**(`name`, `opts`): () => `boolean`

Defined in: [packages/network/src/server/broker.ts:109](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/server/broker.ts#L109)

Registers channel validation and/or a server-side handler.

#### Parameters

##### name

`string`

##### opts

`ChannelOptions`

#### Returns

> (): `boolean`

##### Returns

`boolean`

***

### registerReliable()

> **registerReliable**(`topic`, `fn`): () => `boolean`

Defined in: [packages/network/src/server/broker.ts:296](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/server/broker.ts#L296)

Registers a reliable request handler for a given topic.

#### Parameters

##### topic

`string`

##### fn

(`payload`, `peer`) => `any`

#### Returns

> (): `boolean`

##### Returns

`boolean`

***

### registerRpc()

> **registerRpc**(`name`, `fn`): () => `boolean`

Defined in: [packages/network/src/server/broker.ts:156](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/server/broker.ts#L156)

Registers an RPC handler hosted by the server.

#### Parameters

##### name

`string`

##### fn

(`payload`, `peer`) => `any`

#### Returns

> (): `boolean`

##### Returns

`boolean`

***

### roomsForPeer()

> **roomsForPeer**(`peerId`): `string`[]

Defined in: [packages/network/src/server/broker.ts:119](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/server/broker.ts#L119)

Returns rooms for a given peer.

#### Parameters

##### peerId

`string`

#### Returns

`string`[]
