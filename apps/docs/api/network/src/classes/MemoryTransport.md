[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / MemoryTransport

# Class: MemoryTransport

Defined in: [network/src/transports/memory/transport.ts:9](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/transports/memory/transport.ts#L9)

A transport for in-memory communication.

## Implements

- [`Transport`](../interfaces/Transport.md)

## Constructors

### Constructor

> **new MemoryTransport**(`hub`, `peerId`): `MemoryTransport`

Defined in: [network/src/transports/memory/transport.ts:19](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/transports/memory/transport.ts#L19)

#### Parameters

##### hub

[`MemoryHub`](../interfaces/MemoryHub.md)

##### peerId

`string` = `...`

#### Returns

`MemoryTransport`

## Properties

### kind

> `readonly` **kind**: `"memory"` = `'memory'`

Defined in: [network/src/transports/memory/transport.ts:10](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/transports/memory/transport.ts#L10)

The kind of transport.

#### Implementation of

[`Transport`](../interfaces/Transport.md).[`kind`](../interfaces/Transport.md#kind)

***

### supportsBinary

> `readonly` **supportsBinary**: `true` = `true`

Defined in: [network/src/transports/memory/transport.ts:11](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/transports/memory/transport.ts#L11)

Whether the transport supports binary.

#### Implementation of

[`Transport`](../interfaces/Transport.md).[`supportsBinary`](../interfaces/Transport.md#supportsbinary)

## Methods

### connect()

> **connect**(): `Promise`\<`void`\>

Defined in: [network/src/transports/memory/transport.ts:35](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/transports/memory/transport.ts#L35)

Connect to the transport.

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`Transport`](../interfaces/Transport.md).[`connect`](../interfaces/Transport.md#connect)

***

### disconnect()

> **disconnect**(): `Promise`\<`void`\>

Defined in: [network/src/transports/memory/transport.ts:51](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/transports/memory/transport.ts#L51)

Disconnect from the transport.

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`Transport`](../interfaces/Transport.md).[`disconnect`](../interfaces/Transport.md#disconnect)

***

### getStatus()

> **getStatus**(): [`TransportStatus`](../type-aliases/TransportStatus.md)

Defined in: [network/src/transports/memory/transport.ts:28](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/transports/memory/transport.ts#L28)

Get the status of the transport.

#### Returns

[`TransportStatus`](../type-aliases/TransportStatus.md)

The status.

#### Implementation of

[`Transport`](../interfaces/Transport.md).[`getStatus`](../interfaces/Transport.md#getstatus)

***

### onMessage()

> **onMessage**(`fn`): () => `boolean`

Defined in: [network/src/transports/memory/transport.ts:71](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/transports/memory/transport.ts#L71)

On message handler.

#### Parameters

##### fn

(`data`, `meta?`) => `void`

The handler.

#### Returns

The unsubscribe function.

> (): `boolean`

##### Returns

`boolean`

#### Implementation of

[`Transport`](../interfaces/Transport.md).[`onMessage`](../interfaces/Transport.md#onmessage)

***

### onStatus()

> **onStatus**(`fn`): () => `boolean`

Defined in: [network/src/transports/memory/transport.ts:81](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/transports/memory/transport.ts#L81)

On status handler.

#### Parameters

##### fn

(`status`) => `void`

The handler.

#### Returns

The unsubscribe function.

> (): `boolean`

##### Returns

`boolean`

#### Implementation of

[`Transport`](../interfaces/Transport.md).[`onStatus`](../interfaces/Transport.md#onstatus)

***

### send()

> **send**(`data`): `void`

Defined in: [network/src/transports/memory/transport.ts:61](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/transports/memory/transport.ts#L61)

Send a message.

#### Parameters

##### data

`Uint8Array`

The data.

#### Returns

`void`

#### Implementation of

[`Transport`](../interfaces/Transport.md).[`send`](../interfaces/Transport.md#send)
