[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / SnapshotSystem

# Class: SnapshotSystem

Defined in: [network/src/systems/SnapshotSystem.ts:9](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/systems/SnapshotSystem.ts#L9)

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

Defined in: [network/src/systems/SnapshotSystem.ts:12](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/systems/SnapshotSystem.ts#L12)

The order of the update that this system is registered for.

#### Overrides

`System.order`

***

### updateKind

> `static` **updateKind**: `"fixed"` \| `"frame"` = `'fixed'`

Defined in: [network/src/systems/SnapshotSystem.ts:10](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/systems/SnapshotSystem.ts#L10)

The kind of update that this system is registered for.
Defaults to 'fixed'.

#### Overrides

`System.updateKind`

***

### updatePhase

> `static` **updatePhase**: `"early"` \| `"update"` \| `"late"` = `'update'`

Defined in: [network/src/systems/SnapshotSystem.ts:11](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/systems/SnapshotSystem.ts#L11)

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

Defined in: [network/src/systems/SnapshotSystem.ts:14](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/network/src/systems/SnapshotSystem.ts#L14)

Method that will be called on every tick that this system is registered for.

#### Parameters

##### dt

`number`

#### Returns

`void`

#### Overrides

`System.update`
