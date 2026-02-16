[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / Transport

# Interface: Transport

Defined in: [packages/network/src/types.ts:14](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/network/src/types.ts#L14)

Low-level transport deals only in bytes; higher layers handle encoding.

## Properties

### kind

> `readonly` **kind**: `string`

Defined in: [packages/network/src/types.ts:18](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/network/src/types.ts#L18)

The kind of transport.

***

### supportsBinary

> `readonly` **supportsBinary**: `boolean`

Defined in: [packages/network/src/types.ts:22](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/network/src/types.ts#L22)

Whether the transport supports binary.

## Methods

### connect()

> **connect**(): `Promise`\<`void`\>

Defined in: [packages/network/src/types.ts:31](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/network/src/types.ts#L31)

Connect to the transport.

#### Returns

`Promise`\<`void`\>

***

### disconnect()

> **disconnect**(`code?`, `reason?`): `Promise`\<`void`\>

Defined in: [packages/network/src/types.ts:37](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/network/src/types.ts#L37)

Disconnect from the transport.

#### Parameters

##### code?

`number`

The code.

##### reason?

`string`

The reason.

#### Returns

`Promise`\<`void`\>

***

### getStatus()

> **getStatus**(): [`TransportStatus`](../type-aliases/TransportStatus.md)

Defined in: [packages/network/src/types.ts:27](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/network/src/types.ts#L27)

Get the status of the transport.

#### Returns

[`TransportStatus`](../type-aliases/TransportStatus.md)

The status.

***

### onMessage()

> **onMessage**(`fn`): () => `void`

Defined in: [packages/network/src/types.ts:48](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/network/src/types.ts#L48)

On message handler.

#### Parameters

##### fn

(`data`, `meta?`) => `void`

The handler.

#### Returns

The unsubscribe function.

> (): `void`

##### Returns

`void`

***

### onPeerJoin()?

> `optional` **onPeerJoin**(`fn`): () => `void`

Defined in: [packages/network/src/types.ts:59](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/network/src/types.ts#L59)

Optional peer lifecycle (for P2P transports).

#### Parameters

##### fn

(`peerId`) => `void`

#### Returns

> (): `void`

##### Returns

`void`

***

### onPeerLeave()?

> `optional` **onPeerLeave**(`fn`): () => `void`

Defined in: [packages/network/src/types.ts:60](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/network/src/types.ts#L60)

#### Parameters

##### fn

(`peerId`) => `void`

#### Returns

> (): `void`

##### Returns

`void`

***

### onStatus()

> **onStatus**(`fn`): () => `void`

Defined in: [packages/network/src/types.ts:56](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/network/src/types.ts#L56)

On status handler.

#### Parameters

##### fn

(`status`) => `void`

The handler.

#### Returns

The unsubscribe function.

> (): `void`

##### Returns

`void`

***

### peers()?

> `optional` **peers**(): `string`[]

Defined in: [packages/network/src/types.ts:61](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/network/src/types.ts#L61)

#### Returns

`string`[]

***

### send()

> **send**(`data`): `void` \| `Promise`\<`void`\>

Defined in: [packages/network/src/types.ts:42](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/network/src/types.ts#L42)

Send a message.

#### Parameters

##### data

`Uint8Array`

The data.

#### Returns

`void` \| `Promise`\<`void`\>
