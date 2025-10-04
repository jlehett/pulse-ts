[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / Visibility

# Class: Visibility

Defined in: [packages/core/src/domain/components/meta/Visibility.ts:6](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/core/src/domain/components/meta/Visibility.ts#L6)

The visibility of a node.

## Extends

- [`Component`](Component.md)

## Constructors

### Constructor

> **new Visibility**(): `Visibility`

#### Returns

`Visibility`

#### Inherited from

[`Component`](Component.md).[`constructor`](Component.md#constructor)

## Properties

### visible

> **visible**: `boolean` = `true`

Defined in: [packages/core/src/domain/components/meta/Visibility.ts:7](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/core/src/domain/components/meta/Visibility.ts#L7)

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
