[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / Transform

# Class: Transform

Defined in: [packages/core/src/domain/components/spatial/Transform.ts:54](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/components/spatial/Transform.ts#L54)

A transform.

## Extends

- [`Component`](Component.md)

## Constructors

### Constructor

> **new Transform**(): `Transform`

Defined in: [packages/core/src/domain/components/spatial/Transform.ts:81](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/components/spatial/Transform.ts#L81)

#### Returns

`Transform`

#### Overrides

[`Component`](Component.md).[`constructor`](Component.md#constructor)

## Properties

### \_localVersion

> **\_localVersion**: `number` = `0`

Defined in: [packages/core/src/domain/components/spatial/Transform.ts:74](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/components/spatial/Transform.ts#L74)

***

### \[kTransformDirty\]

> **\[kTransformDirty\]**: `any`

Defined in: [packages/core/src/domain/components/spatial/Transform.ts:62](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/components/spatial/Transform.ts#L62)

***

### localPosition

> `readonly` **localPosition**: [`Vec3`](Vec3.md)

Defined in: [packages/core/src/domain/components/spatial/Transform.ts:64](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/components/spatial/Transform.ts#L64)

***

### localRotation

> `readonly` **localRotation**: [`Quat`](Quat.md)

Defined in: [packages/core/src/domain/components/spatial/Transform.ts:66](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/components/spatial/Transform.ts#L66)

***

### localScale

> `readonly` **localScale**: [`Vec3`](Vec3.md)

Defined in: [packages/core/src/domain/components/spatial/Transform.ts:68](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/components/spatial/Transform.ts#L68)

***

### previousLocalPosition

> `readonly` **previousLocalPosition**: [`Vec3`](Vec3.md)

Defined in: [packages/core/src/domain/components/spatial/Transform.ts:65](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/components/spatial/Transform.ts#L65)

***

### previousLocalRotation

> `readonly` **previousLocalRotation**: [`Quat`](Quat.md)

Defined in: [packages/core/src/domain/components/spatial/Transform.ts:67](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/components/spatial/Transform.ts#L67)

***

### previousLocalScale

> `readonly` **previousLocalScale**: [`Vec3`](Vec3.md)

Defined in: [packages/core/src/domain/components/spatial/Transform.ts:69](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/components/spatial/Transform.ts#L69)

## Accessors

### owner

#### Get Signature

> **get** **owner**(): [`Node`](Node.md)

Defined in: [packages/core/src/domain/ecs/base/Component.ts:17](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/ecs/base/Component.ts#L17)

The owner of the component.

##### Returns

[`Node`](Node.md)

#### Inherited from

[`Component`](Component.md).[`owner`](Component.md#owner)

***

### worldPosition

#### Get Signature

> **get** **worldPosition**(): [`Vec3`](Vec3.md)

Defined in: [packages/core/src/domain/components/spatial/Transform.ts:238](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/components/spatial/Transform.ts#L238)

##### Returns

[`Vec3`](Vec3.md)

***

### worldRotation

#### Get Signature

> **get** **worldRotation**(): [`Quat`](Quat.md)

Defined in: [packages/core/src/domain/components/spatial/Transform.ts:241](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/components/spatial/Transform.ts#L241)

##### Returns

[`Quat`](Quat.md)

***

### worldScale

#### Get Signature

> **get** **worldScale**(): [`Vec3`](Vec3.md)

Defined in: [packages/core/src/domain/components/spatial/Transform.ts:244](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/components/spatial/Transform.ts#L244)

##### Returns

[`Vec3`](Vec3.md)

## Methods

### \[kSetComponentOwner\]()

> **\[kSetComponentOwner\]**(`owner`): `void`

Defined in: [packages/core/src/domain/ecs/base/Component.ts:10](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/ecs/base/Component.ts#L10)

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

Defined in: [packages/core/src/domain/components/spatial/Transform.ts:125](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/components/spatial/Transform.ts#L125)

#### Parameters

##### fn

(`t`) => `void`

#### Returns

`void`

***

### getAncestryVersion()

> **getAncestryVersion**(`frameId`): `number`

Defined in: [packages/core/src/domain/components/spatial/Transform.ts:91](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/components/spatial/Transform.ts#L91)

#### Parameters

##### frameId

`number`

#### Returns

`number`

***

### getLocalTRS()

> **getLocalTRS**(`out?`, `alpha?`): [`TRS`](../interfaces/TRS.md)

Defined in: [packages/core/src/domain/components/spatial/Transform.ts:131](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/components/spatial/Transform.ts#L131)

#### Parameters

##### out?

[`TRS`](../interfaces/TRS.md)

##### alpha?

`number`

#### Returns

[`TRS`](../interfaces/TRS.md)

***

### getWorldTRS()

> **getWorldTRS**(`out?`, `alpha?`): [`TRS`](../interfaces/TRS.md)

Defined in: [packages/core/src/domain/components/spatial/Transform.ts:158](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/components/spatial/Transform.ts#L158)

#### Parameters

##### out?

[`TRS`](../interfaces/TRS.md)

##### alpha?

`number`

#### Returns

[`TRS`](../interfaces/TRS.md)

***

### getWorldVersion()

> **getWorldVersion**(): `number`

Defined in: [packages/core/src/domain/components/spatial/Transform.ts:248](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/components/spatial/Transform.ts#L248)

#### Returns

`number`

***

### setLocal()

> **setLocal**(`opts`): `void`

Defined in: [packages/core/src/domain/components/spatial/Transform.ts:112](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/components/spatial/Transform.ts#L112)

#### Parameters

##### opts

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

Defined in: [packages/core/src/domain/components/spatial/Transform.ts:105](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/components/spatial/Transform.ts#L105)

#### Returns

`void`

***

### attach()

> `static` **attach**\<`Transform`\>(`owner`): `Transform`

Defined in: [packages/core/src/domain/components/spatial/Transform.ts:55](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/components/spatial/Transform.ts#L55)

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
