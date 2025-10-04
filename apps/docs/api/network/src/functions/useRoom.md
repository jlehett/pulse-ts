[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / useRoom

# Function: useRoom()

> **useRoom**(`room`): `void`

Defined in: [packages/network/src/fc/hooks.ts:390](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/network/src/fc/hooks.ts#L390)

Joins a server-side room for channel routing and leaves on unmount.

- Works with the server broker's reserved channel.
- Safe to call before connection; message queues until transport opens.

## Parameters

### room

`string`

## Returns

`void`
