[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / Component

# Abstract Class: Component

Defined in: [core/src/Component.ts:7](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/Component.ts#L7)

A base class for all components.

## Extended by

- [`Bounds`](Bounds.md)
- [`Transform`](Transform.md)
- [`Visibility`](Visibility.md)
- [`State`](State.md)
- [`StableId`](StableId.md)

## Constructors

### Constructor

> **new Component**(): `Component`

#### Returns

`Component`

## Accessors

### owner

#### Get Signature

> **get** **owner**(): [`Node`](Node.md)

Defined in: [core/src/Component.ts:17](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/Component.ts#L17)

The owner of the component.

##### Returns

[`Node`](Node.md)

## Methods

### \[kSetComponentOwner\]()

> **\[kSetComponentOwner\]**(`owner`): `void`

Defined in: [core/src/Component.ts:10](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/Component.ts#L10)

#### Parameters

##### owner

[`Node`](Node.md)

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

`T` *extends* `Component`

#### Parameters

##### this

() => `T`

##### owner

[`Node`](Node.md)

The owner of the component.

#### Returns

`T`

The component.
