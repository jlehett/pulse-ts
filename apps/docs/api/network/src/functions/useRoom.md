[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / useRoom

# Function: useRoom()

> **useRoom**(`room`): `void`

Defined in: [network/src/fc/hooks.ts:165](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/fc/hooks.ts#L165)

Joins a server-side room for channel routing and leaves on unmount.

- Works with the server broker's `__room` channel.
- Safe to call before connection; message queues until transport opens.

## Parameters

### room

`string`

## Returns

`void`
