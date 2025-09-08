[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / CullingCamera

# Class: CullingCamera

Defined in: [core/src/services/CullingCamera.ts:6](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/services/CullingCamera.ts#L6)

A service that provides a culling camera.

## Extends

- [`Service`](Service.md)

## Constructors

### Constructor

> **new CullingCamera**(`projView`): `CullingCamera`

Defined in: [core/src/services/CullingCamera.ts:7](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/services/CullingCamera.ts#L7)

#### Parameters

##### projView

`Float32Array`

#### Returns

`CullingCamera`

#### Overrides

[`Service`](Service.md).[`constructor`](Service.md#constructor)

## Properties

### projView

> **projView**: `Float32Array`

Defined in: [core/src/services/CullingCamera.ts:7](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/services/CullingCamera.ts#L7)

## Methods

### attach()

> **attach**(`world`): `void`

Defined in: [core/src/Service.ts:16](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/Service.ts#L16)

Attaches the service to the world.

#### Parameters

##### world

[`World`](World.md)

The world to attach the service to.

#### Returns

`void`

#### Inherited from

[`Service`](Service.md).[`attach`](Service.md#attach)

***

### detach()

> **detach**(): `void`

Defined in: [core/src/Service.ts:23](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/Service.ts#L23)

Detaches the service from the world.

#### Returns

`void`

#### Inherited from

[`Service`](Service.md).[`detach`](Service.md#detach)
