[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / useChannelTo

# Function: useChannelTo()

> **useChannelTo**\<`T`\>(`to`, `name`, `handler?`): `object`

Defined in: [packages/network/src/fc/hooks.ts:335](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/network/src/fc/hooks.ts#L335)

Use a channel with addressed publish to a specific peer (or peers).

## Type Parameters

### T

`T` = `unknown`

## Parameters

### to

`string` | `string`[]

### name

`ChannelName`

### handler?

[`ChannelHandler`](../type-aliases/ChannelHandler.md)\<`T`\>

## Returns

`object`

### publish()

> `readonly` **publish**: (`data`) => `void`

#### Parameters

##### data

`T`

#### Returns

`void`

### subscribe()

> `readonly` **subscribe**: (`fn`) => [`Unsubscribe`](../type-aliases/Unsubscribe.md)

#### Parameters

##### fn

[`ChannelHandler`](../type-aliases/ChannelHandler.md)\<`T`\>

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)
