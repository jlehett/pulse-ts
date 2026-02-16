[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / EventBus

# Class: EventBus\<E\>

Defined in: [packages/core/src/utils/event.ts:83](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/core/src/utils/event.ts#L83)

Multi-channel event bus. `E` maps event names to payloads.

## Example

```ts
type PlayerEvents = { spawn: { id: number }; hit: { dmg: number } };
const bus = new EventBus<PlayerEvents>();
bus.on('hit', e => ...);
```

## Type Parameters

### E

`E` *extends* `Record`\<`string`, `any`\>

## Constructors

### Constructor

> **new EventBus**\<`E`\>(): `EventBus`\<`E`\>

#### Returns

`EventBus`\<`E`\>

## Methods

### clear()

> **clear**\<`K`\>(`type?`): `void`

Defined in: [packages/core/src/utils/event.ts:132](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/core/src/utils/event.ts#L132)

Remove all listeners.

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### type?

`K`

The event type.

#### Returns

`void`

***

### emit()

> **emit**\<`K`\>(`type`, `e`): `void`

Defined in: [packages/core/src/utils/event.ts:116](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/core/src/utils/event.ts#L116)

Emit an event to all listeners.

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### type

`K`

The event type.

##### e

`E`\[`K`\]

The event.

#### Returns

`void`

***

### on()

> **on**\<`K`\>(`type`, `fn`): () => `void`

Defined in: [packages/core/src/utils/event.ts:92](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/core/src/utils/event.ts#L92)

Subscribe to an event.

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### type

`K`

The event type.

##### fn

[`Listener`](../type-aliases/Listener.md)\<`E`\[`K`\]\>

The listener.

#### Returns

A disposer.

> (): `void`

##### Returns

`void`

***

### once()

> **once**\<`K`\>(`type`, `fn`): () => `void`

Defined in: [packages/core/src/utils/event.ts:103](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/core/src/utils/event.ts#L103)

Subscribe once to an event; auto-unsubscribes after first emission.

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### type

`K`

The event type.

##### fn

[`Listener`](../type-aliases/Listener.md)\<`E`\[`K`\]\>

The listener.

#### Returns

A disposer.

> (): `void`

##### Returns

`void`

***

### size()

> **size**\<`K`\>(`type`): `number`

Defined in: [packages/core/src/utils/event.ts:144](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/core/src/utils/event.ts#L144)

Current listener count (debug).

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### type

`K`

The event type.

#### Returns

`number`

The listener count.
