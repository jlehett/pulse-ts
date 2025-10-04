[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / SnapshotSystem

# Class: SnapshotSystem

Defined in: [packages/network/src/systems/SnapshotSystem.ts:9](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/network/src/systems/SnapshotSystem.ts#L9)

Periodically builds and sends replication snapshots.

- Runs in fixed.update to align with simulation steps.

## Extends

- `System`

## Constructors

### Constructor

> **new SnapshotSystem**(): `SnapshotSystem`

#### Returns

`SnapshotSystem`

#### Inherited from

`System.constructor`

## Properties

### order

> `static` **order**: `number` = `0`

Defined in: [packages/network/src/systems/SnapshotSystem.ts:12](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/network/src/systems/SnapshotSystem.ts#L12)

The order of the update that this system is registered for.

#### Overrides

`System.order`

***

### updateKind

> `static` **updateKind**: `"fixed"` \| `"frame"` = `'fixed'`

Defined in: [packages/network/src/systems/SnapshotSystem.ts:10](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/network/src/systems/SnapshotSystem.ts#L10)

The kind of update that this system is registered for.
Defaults to 'fixed'.

#### Overrides

`System.updateKind`

***

### updatePhase

> `static` **updatePhase**: `"early"` \| `"update"` \| `"late"` = `'update'`

Defined in: [packages/network/src/systems/SnapshotSystem.ts:11](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/network/src/systems/SnapshotSystem.ts#L11)

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

> **update**(`dt`): `void`

Defined in: [packages/network/src/systems/SnapshotSystem.ts:14](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/network/src/systems/SnapshotSystem.ts#L14)

Method that will be called on every tick that this system is registered for.

#### Parameters

##### dt

`number`

#### Returns

`void`

#### Overrides

`System.update`
