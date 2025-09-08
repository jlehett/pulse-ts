[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / InputCommitSystem

# Class: InputCommitSystem

Defined in: [input/src/systems/commit.ts:7](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/input/src/systems/commit.ts#L7)

Runs at frame.early to snapshot inputs before user update.

## Extends

- `System`

## Constructors

### Constructor

> **new InputCommitSystem**(): `InputCommitSystem`

#### Returns

`InputCommitSystem`

#### Inherited from

`System.constructor`

## Properties

### order?

> `static` `optional` **order**: `number`

Defined in: core/dist/index.d.ts:251

The order of the update that this system is registered for.

#### Inherited from

`System.order`

***

### updateKind

> `static` **updateKind**: `UpdateKind` = `'frame'`

Defined in: [input/src/systems/commit.ts:8](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/input/src/systems/commit.ts#L8)

The kind of update that this system is registered for.
Defaults to 'fixed'.

#### Overrides

`System.updateKind`

***

### updatePhase

> `static` **updatePhase**: `UpdatePhase` = `'early'`

Defined in: [input/src/systems/commit.ts:9](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/input/src/systems/commit.ts#L9)

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

> **update**(): `void`

Defined in: [input/src/systems/commit.ts:11](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/input/src/systems/commit.ts#L11)

Method that will be called on every tick that this system is registered for.

#### Returns

`void`

#### Overrides

`System.update`
