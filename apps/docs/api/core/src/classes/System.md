[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / System

# Abstract Class: System

Defined in: [core/src/System.ts:8](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/System.ts#L8)

A system is a behavior that is run on every tick of the specified phase and kind
for a world, and is registered on the world's system node.

## Extended by

- [`CullingSystem`](CullingSystem.md)

## Constructors

### Constructor

> **new System**(): `System`

#### Returns

`System`

## Properties

### order?

> `static` `optional` **order**: `number`

Defined in: [core/src/System.ts:24](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/System.ts#L24)

The order of the update that this system is registered for.

***

### updateKind?

> `static` `optional` **updateKind**: [`UpdateKind`](../type-aliases/UpdateKind.md)

Defined in: [core/src/System.ts:13](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/System.ts#L13)

The kind of update that this system is registered for.
Defaults to 'fixed'.

***

### updatePhase?

> `static` `optional` **updatePhase**: [`UpdatePhase`](../type-aliases/UpdatePhase.md)

Defined in: [core/src/System.ts:19](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/System.ts#L19)

The phase of the update that this system is registered for.
Defaults to 'update'.

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

***

### detach()

> **detach**(): `void`

Defined in: [core/src/System.ts:54](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/System.ts#L54)

Detaches the system from the world.

#### Returns

`void`

***

### update()

> `abstract` **update**(`dt`): `void`

Defined in: [core/src/System.ts:63](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/System.ts#L63)

Method that will be called on every tick that this system is registered for.

#### Parameters

##### dt

`number`

#### Returns

`void`
