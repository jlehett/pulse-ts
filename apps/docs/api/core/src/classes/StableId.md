[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / StableId

# Class: StableId

Defined in: [core/src/components/StableId.ts:9](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/components/StableId.ts#L9)

Stable string identifier for a Node.

- Used by @pulse-ts/save to match nodes in-place across sessions/runs.
- Assign via the `useStableId` hook.

## Extends

- [`Component`](Component.md)

## Constructors

### Constructor

> **new StableId**(): `StableId`

#### Returns

`StableId`

#### Inherited from

[`Component`](Component.md).[`constructor`](Component.md#constructor)

## Properties

### id

> **id**: `string` = `''`

Defined in: [core/src/components/StableId.ts:10](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/components/StableId.ts#L10)

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
