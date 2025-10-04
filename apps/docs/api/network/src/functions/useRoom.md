[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / useRoom

# Function: useRoom()

> **useRoom**(`room`): `void`

Defined in: [packages/network/src/fc/hooks.ts:390](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/network/src/fc/hooks.ts#L390)

Joins a server-side room for channel routing and leaves on unmount.

- Works with the server broker's reserved channel.
- Safe to call before connection; message queues until transport opens.

## Parameters

### room

`string`

## Returns

`void`
