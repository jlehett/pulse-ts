[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / EventBus

# Class: EventBus\<E\>

Defined in: [core/src/event.ts:75](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/event.ts#L75)

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

Defined in: [core/src/event.ts:124](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/event.ts#L124)

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

Defined in: [core/src/event.ts:108](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/event.ts#L108)

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

Defined in: [core/src/event.ts:84](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/event.ts#L84)

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

Defined in: [core/src/event.ts:95](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/event.ts#L95)

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

Defined in: [core/src/event.ts:136](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/event.ts#L136)

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
