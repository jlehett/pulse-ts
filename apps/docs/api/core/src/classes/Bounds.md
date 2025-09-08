[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / Bounds

# Class: Bounds

Defined in: [core/src/components/Bounds.ts:20](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/components/Bounds.ts#L20)

Bounds component: local AABB + cached world AABB + visibility flag.

## Extends

- [`Component`](Component.md)

## Constructors

### Constructor

> **new Bounds**(): `Bounds`

#### Returns

`Bounds`

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

### getLocal()

> **getLocal**(): `null` \| [`AABB`](../interfaces/AABB.md)

Defined in: [core/src/components/Bounds.ts:54](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/components/Bounds.ts#L54)

Gets the local bounds.

#### Returns

`null` \| [`AABB`](../interfaces/AABB.md)

***

### getWorld()

> **getWorld**(`out?`, `alpha?`): `null` \| [`AABB`](../interfaces/AABB.md)

Defined in: [core/src/components/Bounds.ts:63](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/components/Bounds.ts#L63)

Gets the world bounds.

#### Parameters

##### out?

[`AABB`](../interfaces/AABB.md)

The output bounds.

##### alpha?

`number`

The alpha for the interpolation.

#### Returns

`null` \| [`AABB`](../interfaces/AABB.md)

***

### setLocal()

> **setLocal**(`min`, `max`): `void`

Defined in: [core/src/components/Bounds.ts:46](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/components/Bounds.ts#L46)

Sets the local bounds.

#### Parameters

##### min

[`Vec3`](Vec3.md)

##### max

[`Vec3`](Vec3.md)

#### Returns

`void`

***

### attach()

> `static` **attach**\<`Bounds`\>(`owner`): `Bounds`

Defined in: [core/src/components/Bounds.ts:21](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/components/Bounds.ts#L21)

Attaches the component to an owner. Override this method to implement
custom attachment logic.

#### Type Parameters

##### Bounds

`Bounds`

#### Parameters

##### owner

[`Node`](Node.md)

The owner of the component.

#### Returns

`Bounds`

The component.

#### Overrides

[`Component`](Component.md).[`attach`](Component.md#attach)
