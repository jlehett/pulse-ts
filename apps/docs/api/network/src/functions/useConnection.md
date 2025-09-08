[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / useConnection

# Function: useConnection()

> **useConnection**(`init`): `object`

Defined in: [network/src/fc/hooks.ts:34](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/fc/hooks.ts#L34)

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
