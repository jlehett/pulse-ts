[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / State

# Class: State

Defined in: [packages/core/src/domain/components/meta/State.ts:6](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/core/src/domain/components/meta/State.ts#L6)

Generic key/value state store component for a Node.

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

Defined in: [packages/core/src/domain/ecs/base/Component.ts:17](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/core/src/domain/ecs/base/Component.ts#L17)

The owner of the component.

##### Returns

[`Node`](Node.md)

#### Inherited from

[`Component`](Component.md).[`owner`](Component.md#owner)

## Methods

### \[kSetComponentOwner\]()

> **\[kSetComponentOwner\]**(`owner`): `void`

Defined in: [packages/core/src/domain/ecs/base/Component.ts:10](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/core/src/domain/ecs/base/Component.ts#L10)

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

Defined in: [packages/core/src/domain/components/meta/State.ts:21](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/core/src/domain/components/meta/State.ts#L21)

#### Returns

\[`string`, `unknown`\][]

***

### get()

> **get**\<`T`\>(`key`): `undefined` \| `T`

Defined in: [packages/core/src/domain/components/meta/State.ts:13](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/core/src/domain/components/meta/State.ts#L13)

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### key

`string`

#### Returns

`undefined` \| `T`

***

### has()

> **has**(`key`): `boolean`

Defined in: [packages/core/src/domain/components/meta/State.ts:9](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/core/src/domain/components/meta/State.ts#L9)

#### Parameters

##### key

`string`

#### Returns

`boolean`

***

### loadEntries()

> **loadEntries**(`entries`): `void`

Defined in: [packages/core/src/domain/components/meta/State.ts:25](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/core/src/domain/components/meta/State.ts#L25)

#### Parameters

##### entries

\[`string`, `unknown`\][]

#### Returns

`void`

***

### set()

> **set**\<`T`\>(`key`, `value`): `void`

Defined in: [packages/core/src/domain/components/meta/State.ts:17](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/core/src/domain/components/meta/State.ts#L17)

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### key

`string`

##### value

`T`

#### Returns

`void`

***

### attach()

> `static` **attach**\<`T`\>(`this`, `owner`): `T`

Defined in: [packages/core/src/domain/ecs/base/Component.ts:27](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/core/src/domain/ecs/base/Component.ts#L27)

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
