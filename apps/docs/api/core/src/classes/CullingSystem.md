[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / CullingSystem

# Class: CullingSystem

Defined in: [packages/core/src/domain/systems/Culling.ts:116](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/core/src/domain/systems/Culling.ts#L116)

Iterates nodes with Bounds and updates Visibility from camera frustum.

## Extends

- [`System`](System.md)

## Constructors

### Constructor

> **new CullingSystem**(): `CullingSystem`

#### Returns

`CullingSystem`

#### Inherited from

[`System`](System.md).[`constructor`](System.md#constructor)

## Properties

### order?

> `static` `optional` **order**: `number`

Defined in: [packages/core/src/domain/ecs/base/System.ts:24](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/core/src/domain/ecs/base/System.ts#L24)

The order of the update that this system is registered for.

#### Inherited from

[`System`](System.md).[`order`](System.md#order)

***

### updateKind

> `static` **updateKind**: [`UpdateKind`](../type-aliases/UpdateKind.md) = `'frame'`

Defined in: [packages/core/src/domain/systems/Culling.ts:117](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/core/src/domain/systems/Culling.ts#L117)

The kind of update that this system is registered for.
Defaults to 'fixed'.

#### Overrides

[`System`](System.md).[`updateKind`](System.md#updatekind)

***

### updatePhase

> `static` **updatePhase**: [`UpdatePhase`](../type-aliases/UpdatePhase.md) = `'update'`

Defined in: [packages/core/src/domain/systems/Culling.ts:118](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/core/src/domain/systems/Culling.ts#L118)

The phase of the update that this system is registered for.
Defaults to 'update'.

#### Overrides

[`System`](System.md).[`updatePhase`](System.md#updatephase)

## Methods

### attach()

> **attach**(`world`): `void`

Defined in: [packages/core/src/domain/ecs/base/System.ts:37](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/core/src/domain/ecs/base/System.ts#L37)

Attaches the system to the world.

#### Parameters

##### world

[`World`](World.md)

The world to attach the system to.

#### Returns

`void`

#### Inherited from

[`System`](System.md).[`attach`](System.md#attach)

***

### detach()

> **detach**(): `void`

Defined in: [packages/core/src/domain/ecs/base/System.ts:54](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/core/src/domain/ecs/base/System.ts#L54)

Detaches the system from the world.

#### Returns

`void`

#### Inherited from

[`System`](System.md).[`detach`](System.md#detach)

***

### update()

> **update**(): `void`

Defined in: [packages/core/src/domain/systems/Culling.ts:127](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/core/src/domain/systems/Culling.ts#L127)

Updates the frustum and culls nodes.

#### Returns

`void`

True if the frustum intersects the bounds, false otherwise.

#### Overrides

[`System`](System.md).[`update`](System.md#update)
