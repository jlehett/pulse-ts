[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / Bounds

# Class: Bounds

Defined in: [packages/core/src/domain/components/spatial/Bounds.ts:21](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/components/spatial/Bounds.ts#L21)

Bounds component: local AABB + cached/calc world AABB.

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

Defined in: [packages/core/src/domain/ecs/base/Component.ts:17](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/ecs/base/Component.ts#L17)

The owner of the component.

##### Returns

[`Node`](Node.md)

#### Inherited from

[`Component`](Component.md).[`owner`](Component.md#owner)

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

### getLocal()

> **getLocal**(): `null` \| [`AABB`](../interfaces/AABB.md)

Defined in: [packages/core/src/domain/components/spatial/Bounds.ts:53](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/components/spatial/Bounds.ts#L53)

#### Returns

`null` \| [`AABB`](../interfaces/AABB.md)

***

### getWorld()

> **getWorld**(`out?`, `alpha?`): `null` \| [`AABB`](../interfaces/AABB.md)

Defined in: [packages/core/src/domain/components/spatial/Bounds.ts:57](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/components/spatial/Bounds.ts#L57)

#### Parameters

##### out?

[`AABB`](../interfaces/AABB.md)

##### alpha?

`number`

#### Returns

`null` \| [`AABB`](../interfaces/AABB.md)

***

### setLocal()

> **setLocal**(`min`, `max`): `void`

Defined in: [packages/core/src/domain/components/spatial/Bounds.ts:46](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/components/spatial/Bounds.ts#L46)

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

Defined in: [packages/core/src/domain/components/spatial/Bounds.ts:22](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/components/spatial/Bounds.ts#L22)

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
