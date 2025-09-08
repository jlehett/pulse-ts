[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / TypedEvent

# Class: TypedEvent\<T\>

Defined in: [core/src/event.ts:10](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/event.ts#L10)

A single-channel, strongly-typed event.

## Type Parameters

### T

`T`

## Constructors

### Constructor

> **new TypedEvent**\<`T`\>(): `TypedEvent`\<`T`\>

#### Returns

`TypedEvent`\<`T`\>

## Accessors

### size

#### Get Signature

> **get** **size**(): `number`

Defined in: [core/src/event.ts:60](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/event.ts#L60)

Current listener count (debug).

##### Returns

`number`

## Methods

### clear()

> **clear**(): `void`

Defined in: [core/src/event.ts:53](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/event.ts#L53)

Remove all listeners.

#### Returns

`void`

***

### emit()

> **emit**(`e`): `void`

Defined in: [core/src/event.ts:40](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/event.ts#L40)

Emit an event to all listeners.

#### Parameters

##### e

`T`

The event.

#### Returns

`void`

***

### on()

> **on**(`fn`): () => `void`

Defined in: [core/src/event.ts:18](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/event.ts#L18)

Subscribe; returns a disposer.

#### Parameters

##### fn

[`Listener`](../type-aliases/Listener.md)\<`T`\>

The listener.

#### Returns

A disposer.

> (): `void`

##### Returns

`void`

***

### once()

> **once**(`fn`): () => `void`

Defined in: [core/src/event.ts:28](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/event.ts#L28)

Subscribe once; auto-unsubscribes after first emission.

#### Parameters

##### fn

[`Listener`](../type-aliases/Listener.md)\<`T`\>

The listener.

#### Returns

A disposer.

> (): `void`

##### Returns

`void`
