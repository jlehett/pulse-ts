[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / useChannel

# Function: useChannel()

> **useChannel**\<`T`\>(`name`, `handler?`): `object`

Defined in: [network/src/fc/hooks.ts:83](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/fc/hooks.ts#L83)

Use a channel to send and receive messages.

## Type Parameters

### T

`T` = `unknown`

## Parameters

### name

`string`

The name of the channel.

### handler?

[`ChannelHandler`](../type-aliases/ChannelHandler.md)\<`T`\>

The handler for the channel.

## Returns

The channel.

### publish()

> `readonly` **publish**: (`data`) => `void`

Publish a message to the channel.

#### Parameters

##### data

`T`

The message to publish.

#### Returns

`void`

### subscribe()

> `readonly` **subscribe**: (`fn`) => [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Subscribe to the channel.

#### Parameters

##### fn

[`ChannelHandler`](../type-aliases/ChannelHandler.md)\<`T`\>

The handler for the channel.

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

The channel.
