[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / CullingSystem

# Class: CullingSystem

Defined in: [core/src/systems/Culling.ts:115](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/systems/Culling.ts#L115)

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

Defined in: [core/src/System.ts:24](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/System.ts#L24)

The order of the update that this system is registered for.

#### Inherited from

[`System`](System.md).[`order`](System.md#order)

***

### updateKind

> `static` **updateKind**: [`UpdateKind`](../type-aliases/UpdateKind.md) = `'frame'`

Defined in: [core/src/systems/Culling.ts:116](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/systems/Culling.ts#L116)

The kind of update that this system is registered for.
Defaults to 'fixed'.

#### Overrides

[`System`](System.md).[`updateKind`](System.md#updatekind)

***

### updatePhase

> `static` **updatePhase**: [`UpdatePhase`](../type-aliases/UpdatePhase.md) = `'update'`

Defined in: [core/src/systems/Culling.ts:117](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/systems/Culling.ts#L117)

The phase of the update that this system is registered for.
Defaults to 'update'.

#### Overrides

[`System`](System.md).[`updatePhase`](System.md#updatephase)

## Methods

### attach()

> **attach**(`world`): `void`

Defined in: [core/src/System.ts:37](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/System.ts#L37)

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

Defined in: [core/src/System.ts:54](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/System.ts#L54)

Detaches the system from the world.

#### Returns

`void`

#### Inherited from

[`System`](System.md).[`detach`](System.md#detach)

***

### update()

> **update**(): `void`

Defined in: [core/src/systems/Culling.ts:125](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/systems/Culling.ts#L125)

Updates the frustum and culls nodes.

#### Returns

`void`

True if the frustum intersects the bounds, false otherwise.

#### Overrides

[`System`](System.md).[`update`](System.md#update)
