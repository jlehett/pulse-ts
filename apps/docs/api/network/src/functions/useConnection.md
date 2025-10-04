[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / useConnection

# Function: useConnection()

> **useConnection**(`init`): `object`

Defined in: [packages/network/src/fc/hooks.ts:42](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/network/src/fc/hooks.ts#L42)

Use a connection to the network.

## Parameters

### init

`TransportInit`

The transport to use.

## Returns

The connection status and a function to disconnect.

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
