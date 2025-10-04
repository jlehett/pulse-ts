[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / InputCommitSystem

# Class: InputCommitSystem

Defined in: packages/input/src/domain/systems/commit.ts:7

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

Defined in: packages/core/dist/index.d.ts:217

The order of the update that this system is registered for.

#### Inherited from

`System.order`

***

### updateKind

> `static` **updateKind**: `UpdateKind` = `'frame'`

Defined in: packages/input/src/domain/systems/commit.ts:8

The kind of update that this system is registered for.
Defaults to 'fixed'.

#### Overrides

`System.updateKind`

***

### updatePhase

> `static` **updatePhase**: `UpdatePhase` = `'early'`

Defined in: packages/input/src/domain/systems/commit.ts:9

The phase of the update that this system is registered for.
Defaults to 'update'.

#### Overrides

`System.updatePhase`

## Methods

### attach()

> **attach**(`world`): `void`

Defined in: packages/core/dist/index.d.ts:227

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

Defined in: packages/core/dist/index.d.ts:231

Detaches the system from the world.

#### Returns

`void`

#### Inherited from

`System.detach`

***

### update()

> **update**(): `void`

Defined in: packages/input/src/domain/systems/commit.ts:11

Method that will be called on every tick that this system is registered for.

#### Returns

`void`

#### Overrides

`System.update`
