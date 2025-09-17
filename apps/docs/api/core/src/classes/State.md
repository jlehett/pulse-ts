[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / State

# Class: State

Defined in: [core/src/components/State.ts:9](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/components/State.ts#L9)

Generic key/value state store component for a Node.

- JSON-serializable values are recommended for persistence with @pulse-ts/save.
- Intended to back FC state hooks (e.g., useState) without a re-render model.

## Extends

- [`Component`](Component.md)

## Constructors

### Constructor

> **new State**(): `State`

#### Returns

`State`

#### Inherited from

[`Component`](Component.md).[`constructor`](Component.md#constructor)

## Accessors

### owner

#### Get Signature

> **get** **owner**(): [`Node`](Node.md)

Defined in: [core/src/Component.ts:17](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/Component.ts#L17)

The owner of the component.

##### Returns

[`Node`](Node.md)

#### Inherited from

[`Component`](Component.md).[`owner`](Component.md#owner)

## Methods

### \[kSetComponentOwner\]()

> **\[kSetComponentOwner\]**(`owner`): `void`

Defined in: [core/src/Component.ts:10](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/Component.ts#L10)

#### Parameters

##### owner

[`Node`](Node.md)

#### Returns

`void`

#### Inherited from

[`Component`](Component.md).[`[kSetComponentOwner]`](Component.md#ksetcomponentowner)

***

### entries()

> **entries**(): \[`string`, `unknown`\][]

Defined in: [core/src/components/State.ts:43](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/components/State.ts#L43)

Returns a plain array of [key, value] for serialization.

#### Returns

\[`string`, `unknown`\][]

A plain array of [key, value] for serialization.

***

### get()

> **get**\<`T`\>(`key`): `undefined` \| `T`

Defined in: [core/src/components/State.ts:26](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/components/State.ts#L26)

Gets a value for a given key.

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### key

`string`

The key to get the value for.

#### Returns

`undefined` \| `T`

The value for the given key, or undefined if no value exists.

***

### has()

> **has**(`key`): `boolean`

Defined in: [core/src/components/State.ts:17](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/components/State.ts#L17)

Checks if a value exists for a given key.

#### Parameters

##### key

`string`

The key to check.

#### Returns

`boolean`

True if a value exists for the given key, false otherwise.

***

### loadEntries()

> **loadEntries**(`entries`): `void`

Defined in: [core/src/components/State.ts:51](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/components/State.ts#L51)

Loads entries from a plain array of [key, value].

#### Parameters

##### entries

\[`string`, `unknown`\][]

The entries to load.

#### Returns

`void`

***

### set()

> **set**\<`T`\>(`key`, `value`): `void`

Defined in: [core/src/components/State.ts:35](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/components/State.ts#L35)

Sets a value for a given key.

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### key

`string`

The key to set the value for.

##### value

`T`

The value to set.

#### Returns

`void`

***

### attach()

> `static` **attach**\<`T`\>(`this`, `owner`): `T`

Defined in: [core/src/Component.ts:27](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/Component.ts#L27)

Attaches the component to an owner. Override this method to implement
custom attachment logic.

#### Type Parameters

##### T

`T` *extends* [`Component`](Component.md)

#### Parameters

##### this

() => `T`

##### owner

[`Node`](Node.md)

The owner of the component.

#### Returns

`T`

The component.

#### Inherited from

[`Component`](Component.md).[`attach`](Component.md#attach)
