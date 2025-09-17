[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / NetworkServer

# Class: NetworkServer

Defined in: [network/src/server/broker.ts:32](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/server/broker.ts#L32)

Minimal channel/room broker for WebSocket servers.

- Forwards channel packets to peers in the same room(s) (excluding sender).
- Handles a reserved `__room` channel with `{ action: 'join'|'leave', room }`.
- Optional RPC hosting on `__rpc` channel via registerRpc(name, handler).

## Constructors

### Constructor

> **new NetworkServer**(`opts`): `NetworkServer`

Defined in: [network/src/server/broker.ts:60](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/server/broker.ts#L60)

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

`RateLimits`

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

Defined in: [network/src/server/broker.ts:83](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/server/broker.ts#L83)

Binds a ws server (from the 'ws' package) to this broker.

#### Parameters

##### wss

`WsServer`

#### Returns

`void`

***

### broadcast()

> **broadcast**(`packet`, `rooms?`, `exceptId?`): `void`

Defined in: [network/src/server/broker.ts:237](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/server/broker.ts#L237)

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

Defined in: [network/src/server/broker.ts:175](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/server/broker.ts#L175)

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

> **joinRoom**(`peerId`, `room`): `void`

Defined in: [network/src/server/broker.ts:106](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/server/broker.ts#L106)

Registers a room membership.

#### Parameters

##### peerId

`string`

##### room

`string`

#### Returns

`void`

***

### leaveRoom()

> **leaveRoom**(`peerId`, `room`): `void`

Defined in: [network/src/server/broker.ts:121](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/server/broker.ts#L121)

Removes a peer from a room.

#### Parameters

##### peerId

`string`

##### room

`string`

#### Returns

`void`

***

### listPeers()

> **listPeers**(): `string`[]

Defined in: [network/src/server/broker.ts:170](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/server/broker.ts#L170)

Lists all peer ids.

#### Returns

`string`[]

***

### listRooms()

> **listRooms**(): `string`[]

Defined in: [network/src/server/broker.ts:165](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/server/broker.ts#L165)

Lists all room names.

#### Returns

`string`[]

***

### peersInRoom()

> **peersInRoom**(`room`): `string`[]

Defined in: [network/src/server/broker.ts:154](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/server/broker.ts#L154)

Lists peers currently in a room.

#### Parameters

##### room

`string`

#### Returns

`string`[]

***

### registerChannel()

> **registerChannel**(`name`, `opts`): () => `boolean`

Defined in: [network/src/server/broker.ts:131](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/server/broker.ts#L131)

Registers channel validation and/or a server-side handler.

#### Parameters

##### name

`string`

##### opts

###### onMessage?

(`data`, `peer`, `server`) => `boolean` \| `void`

If provided and returns true, the packet is consumed and not forwarded.

###### route?

(`data`, `peer`) => `undefined` \| `null` \| `Iterable`\<`string`, `any`, `any`\>

Override routing rooms; return null/undefined to use peer.rooms.

###### validate?

(`data`, `peer`) => `boolean`

Predicate that must return true for the packet to be accepted.

#### Returns

> (): `boolean`

##### Returns

`boolean`

***

### registerReliable()

> **registerReliable**(`topic`, `fn`): () => `boolean`

Defined in: [network/src/server/broker.ts:440](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/server/broker.ts#L440)

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

Defined in: [network/src/server/broker.ts:228](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/server/broker.ts#L228)

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

Defined in: [network/src/server/broker.ts:159](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/server/broker.ts#L159)

Returns rooms for a given peer.

#### Parameters

##### peerId

`string`

#### Returns

`string`[]
