[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / useMemory

# Function: useMemory()

> **useMemory**(`hub`, `opts?`): `object`

Defined in: [packages/network/src/fc/hooks.ts:90](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/network/src/fc/hooks.ts#L90)

Convenience hook: connect two Worlds in-process via a MemoryHub.

## Parameters

### hub

[`MemoryHub`](../interfaces/MemoryHub.md)

Shared MemoryHub instance.

### opts?

Optional peer configuration.

#### peerId?

`string`

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
