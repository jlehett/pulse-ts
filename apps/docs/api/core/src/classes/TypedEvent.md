[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / TypedEvent

# Class: TypedEvent\<T\>

Defined in: [packages/core/src/utils/event.ts:18](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/core/src/utils/event.ts#L18)

A single-channel, strongly-typed event.

## Example

```ts
const e = new TypedEvent<number>();
const off = e.on((n) => console.log(n));
e.emit(1);
off();
```

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

Defined in: [packages/core/src/utils/event.ts:68](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/core/src/utils/event.ts#L68)

Current listener count (debug).

##### Returns

`number`

## Methods

### clear()

> **clear**(): `void`

Defined in: [packages/core/src/utils/event.ts:61](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/core/src/utils/event.ts#L61)

Remove all listeners.

#### Returns

`void`

***

### emit()

> **emit**(`e`): `void`

Defined in: [packages/core/src/utils/event.ts:48](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/core/src/utils/event.ts#L48)

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

Defined in: [packages/core/src/utils/event.ts:26](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/core/src/utils/event.ts#L26)

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

Defined in: [packages/core/src/utils/event.ts:36](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/core/src/utils/event.ts#L36)

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
