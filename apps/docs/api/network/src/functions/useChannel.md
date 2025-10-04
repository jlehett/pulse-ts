[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / useChannel

# Function: useChannel()

> **useChannel**\<`T`\>(`name`, `handler?`): `object`

Defined in: [packages/network/src/fc/hooks.ts:184](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/network/src/fc/hooks.ts#L184)

Use a channel to send and receive messages.

## Type Parameters

### T

`T` = `unknown`

## Parameters

### name

`ChannelName`

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
