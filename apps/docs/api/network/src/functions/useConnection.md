[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / useConnection

# Function: useConnection()

> **useConnection**(`init`): `object`

Defined in: [packages/network/src/fc/hooks.ts:42](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/fc/hooks.ts#L42)

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
