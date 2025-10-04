[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [network/src](../README.md) / NetworkTick

# Class: NetworkTick

Defined in: [packages/network/src/systems/NetworkTick.ts:8](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/network/src/systems/NetworkTick.ts#L8)

A system that flushes the outgoing and dispatches the incoming messages.

## Extends

- `System`

## Constructors

### Constructor

> **new NetworkTick**(): `NetworkTick`

#### Returns

`NetworkTick`

#### Inherited from

`System.constructor`

## Properties

### order

> `static` **order**: `number` = `-1000`

Defined in: [packages/network/src/systems/NetworkTick.ts:11](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/network/src/systems/NetworkTick.ts#L11)

The order of the update that this system is registered for.

#### Overrides

`System.order`

***

### updateKind

> `static` **updateKind**: `UpdateKind` = `'frame'`

Defined in: [packages/network/src/systems/NetworkTick.ts:9](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/network/src/systems/NetworkTick.ts#L9)

The kind of update that this system is registered for.
Defaults to 'fixed'.

#### Overrides

`System.updateKind`

***

### updatePhase

> `static` **updatePhase**: `UpdatePhase` = `'early'`

Defined in: [packages/network/src/systems/NetworkTick.ts:10](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/network/src/systems/NetworkTick.ts#L10)

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

> **update**(`_dt`): `void`

Defined in: [packages/network/src/systems/NetworkTick.ts:13](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/network/src/systems/NetworkTick.ts#L13)

Method that will be called on every tick that this system is registered for.

#### Parameters

##### \_dt

`number`

#### Returns

`void`

#### Overrides

`System.update`
