[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / InterpolationService

# Class: InterpolationService

Defined in: [network/src/services/InterpolationService.ts:29](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/InterpolationService.ts#L29)

Maintains target TRS for remote entities and smoothly interpolates toward them.

## Extends

- `Service`

## Constructors

### Constructor

> **new InterpolationService**(): `InterpolationService`

#### Returns

`InterpolationService`

#### Inherited from

`Service.constructor`

## Methods

### attach()

> **attach**(`world`): `void`

Defined in: core/dist/index.d.ts:284

Attaches the service to the world.

#### Parameters

##### world

`World`

The world to attach the service to.

#### Returns

`void`

#### Inherited from

`Service.attach`

***

### detach()

> **detach**(): `void`

Defined in: core/dist/index.d.ts:288

Detaches the service from the world.

#### Returns

`void`

#### Inherited from

`Service.detach`

***

### register()

> **register**(`node`, `opts?`): `string`

Defined in: [network/src/services/InterpolationService.ts:37](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/InterpolationService.ts#L37)

Registers or updates the interpolation entry for an entity id.

#### Parameters

##### node

`Node`

The node to drive (must have Transform).

##### opts?

Options including smoothing lambda and snap distance.

###### id?

`string`

###### lambda?

`number`

###### snapDist?

`number`

#### Returns

`string`

***

### setTarget()

> **setTarget**(`id`, `patch`): `void`

Defined in: [network/src/services/InterpolationService.ts:71](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/InterpolationService.ts#L71)

Updates the target for an entity's transform.

#### Parameters

##### id

`string`

##### patch

`Target`

#### Returns

`void`

***

### tick()

> **tick**(`dt`): `void`

Defined in: [network/src/services/InterpolationService.ts:81](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/services/InterpolationService.ts#L81)

Steps interpolation toward targets for all registered entities.

#### Parameters

##### dt

`number`

Delta time in seconds.

#### Returns

`void`
