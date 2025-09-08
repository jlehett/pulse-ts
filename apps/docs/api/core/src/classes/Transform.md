[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / Transform

# Class: Transform

Defined in: [core/src/components/Transform.ts:65](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/components/Transform.ts#L65)

A transform.

## Extends

- [`Component`](Component.md)

## Constructors

### Constructor

> **new Transform**(): `Transform`

Defined in: [core/src/components/Transform.ts:94](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/components/Transform.ts#L94)

#### Returns

`Transform`

#### Overrides

[`Component`](Component.md).[`constructor`](Component.md#constructor)

## Properties

### \_localVersion

> **\_localVersion**: `number` = `0`

Defined in: [core/src/components/Transform.ts:87](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/components/Transform.ts#L87)

***

### \[kTransformDirty\]

> **\[kTransformDirty\]**: `any`

Defined in: [core/src/components/Transform.ts:73](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/components/Transform.ts#L73)

***

### localPosition

> `readonly` **localPosition**: [`Vec3`](Vec3.md)

Defined in: [core/src/components/Transform.ts:75](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/components/Transform.ts#L75)

***

### localRotation

> `readonly` **localRotation**: [`Quat`](Quat.md)

Defined in: [core/src/components/Transform.ts:77](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/components/Transform.ts#L77)

***

### localScale

> `readonly` **localScale**: [`Vec3`](Vec3.md)

Defined in: [core/src/components/Transform.ts:79](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/components/Transform.ts#L79)

***

### previousLocalPosition

> `readonly` **previousLocalPosition**: [`Vec3`](Vec3.md)

Defined in: [core/src/components/Transform.ts:76](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/components/Transform.ts#L76)

***

### previousLocalRotation

> `readonly` **previousLocalRotation**: [`Quat`](Quat.md)

Defined in: [core/src/components/Transform.ts:78](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/components/Transform.ts#L78)

***

### previousLocalScale

> `readonly` **previousLocalScale**: [`Vec3`](Vec3.md)

Defined in: [core/src/components/Transform.ts:80](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/components/Transform.ts#L80)

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

***

### worldPosition

#### Get Signature

> **get** **worldPosition**(): [`Vec3`](Vec3.md)

Defined in: [core/src/components/Transform.ts:284](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/components/Transform.ts#L284)

Gets the world position.

##### Returns

[`Vec3`](Vec3.md)

***

### worldRotation

#### Get Signature

> **get** **worldRotation**(): [`Quat`](Quat.md)

Defined in: [core/src/components/Transform.ts:289](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/components/Transform.ts#L289)

Gets the world rotation.

##### Returns

[`Quat`](Quat.md)

***

### worldScale

#### Get Signature

> **get** **worldScale**(): [`Vec3`](Vec3.md)

Defined in: [core/src/components/Transform.ts:294](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/components/Transform.ts#L294)

Gets the world scale.

##### Returns

[`Vec3`](Vec3.md)

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

### editLocal()

> **editLocal**(`fn`): `void`

Defined in: [core/src/components/Transform.ts:155](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/components/Transform.ts#L155)

Edits the local position, rotation, and scale.

#### Parameters

##### fn

(`t`) => `void`

The function to edit the transform.

#### Returns

`void`

***

### getAncestryVersion()

> **getAncestryVersion**(`frameId`): `number`

Defined in: [core/src/components/Transform.ts:109](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/components/Transform.ts#L109)

Gets the ancestry version.

#### Parameters

##### frameId

`number`

The frame id.

#### Returns

`number`

The ancestry version.

***

### getLocalTRS()

> **getLocalTRS**(`out?`, `alpha?`): [`TRS`](../interfaces/TRS.md)

Defined in: [core/src/components/Transform.ts:167](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/components/Transform.ts#L167)

Gets the local position, rotation, and scale.

#### Parameters

##### out?

[`TRS`](../interfaces/TRS.md)

The output TRS. If not provided, a new TRS will be created.

##### alpha?

`number`

The alpha value.

#### Returns

[`TRS`](../interfaces/TRS.md)

The local position, rotation, and scale.

***

### getWorldTRS()

> **getWorldTRS**(`out?`, `alpha?`): [`TRS`](../interfaces/TRS.md)

Defined in: [core/src/components/Transform.ts:200](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/components/Transform.ts#L200)

Gets the world position, rotation, and scale.

#### Parameters

##### out?

[`TRS`](../interfaces/TRS.md)

The output TRS. If not provided, a new TRS will be created.

##### alpha?

`number`

The alpha value.

#### Returns

[`TRS`](../interfaces/TRS.md)

The world position, rotation, and scale.

***

### getWorldVersion()

> **getWorldVersion**(): `number`

Defined in: [core/src/components/Transform.ts:302](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/components/Transform.ts#L302)

A monotonically increasing version that changes whenever the cached world TRS updates.
Useful for external sync systems to detect whether a recomposition occurred for alpha=0.

#### Returns

`number`

***

### setLocal()

> **setLocal**(`opts`): `void`

Defined in: [core/src/components/Transform.ts:138](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/components/Transform.ts#L138)

Sets the local position, rotation, and scale.

#### Parameters

##### opts

The options to set.

###### position?

`Partial`\<[`Vec3`](Vec3.md)\>

###### rotationQuat?

`Partial`\<[`Quat`](Quat.md)\>

###### scale?

`Partial`\<[`Vec3`](Vec3.md)\>

#### Returns

`void`

***

### snapshotPrevious()

> **snapshotPrevious**(): `void`

Defined in: [core/src/components/Transform.ts:126](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/components/Transform.ts#L126)

Copies the current local position, rotation, and scale to the previous values.

#### Returns

`void`

***

### attach()

> `static` **attach**\<`Transform`\>(`owner`): `Transform`

Defined in: [core/src/components/Transform.ts:66](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/components/Transform.ts#L66)

Attaches the component to an owner. Override this method to implement
custom attachment logic.

#### Type Parameters

##### Transform

`Transform`

#### Parameters

##### owner

[`Node`](Node.md)

The owner of the component.

#### Returns

`Transform`

The component.

#### Overrides

[`Component`](Component.md).[`attach`](Component.md#attach)
