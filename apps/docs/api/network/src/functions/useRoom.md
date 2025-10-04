[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / useRoom

# Function: useRoom()

> **useRoom**(`room`): `void`

Defined in: [packages/network/src/fc/hooks.ts:390](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/network/src/fc/hooks.ts#L390)

Joins a server-side room for channel routing and leaves on unmount.

- Works with the server broker's reserved channel.
- Safe to call before connection; message queues until transport opens.

## Parameters

### room

`string`

## Returns

`void`
