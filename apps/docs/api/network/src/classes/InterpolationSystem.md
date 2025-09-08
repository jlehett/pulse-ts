[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / InterpolationSystem

# Class: InterpolationSystem

Defined in: [network/src/systems/InterpolationSystem.ts:7](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/systems/InterpolationSystem.ts#L7)

Smoothly moves transforms toward replicated targets each frame.

## Extends

- `System`

## Constructors

### Constructor

> **new InterpolationSystem**(): `InterpolationSystem`

#### Returns

`InterpolationSystem`

#### Inherited from

`System.constructor`

## Properties

### order

> `static` **order**: `number` = `100`

Defined in: [network/src/systems/InterpolationSystem.ts:10](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/systems/InterpolationSystem.ts#L10)

The order of the update that this system is registered for.

#### Overrides

`System.order`

***

### updateKind

> `static` **updateKind**: `"fixed"` \| `"frame"` = `'frame'`

Defined in: [network/src/systems/InterpolationSystem.ts:8](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/systems/InterpolationSystem.ts#L8)

The kind of update that this system is registered for.
Defaults to 'fixed'.

#### Overrides

`System.updateKind`

***

### updatePhase

> `static` **updatePhase**: `"early"` \| `"update"` \| `"late"` = `'update'`

Defined in: [network/src/systems/InterpolationSystem.ts:9](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/systems/InterpolationSystem.ts#L9)

The phase of the update that this system is registered for.
Defaults to 'update'.

#### Overrides

`System.updatePhase`

## Methods

### attach()

> **attach**(`world`): `void`

Defined in: core/dist/index.d.ts:261

Attaches the system to the world.

#### Parameters

##### world

`World`

The world to attach the system to.

#### Returns

`void`

#### Inherited from

`System.attach`

***

### detach()

> **detach**(): `void`

Defined in: core/dist/index.d.ts:265

Detaches the system from the world.

#### Returns

`void`

#### Inherited from

`System.detach`

***

### update()

> **update**(`dt`): `void`

Defined in: [network/src/systems/InterpolationSystem.ts:12](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/systems/InterpolationSystem.ts#L12)

Method that will be called on every tick that this system is registered for.

#### Parameters

##### dt

`number`

#### Returns

`void`

#### Overrides

`System.update`
