[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / TimeoutScheduler

# Class: TimeoutScheduler

Defined in: [packages/core/src/infra/scheduler/TimeoutScheduler.ts:6](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/core/src/infra/scheduler/TimeoutScheduler.ts#L6)

A scheduler that uses setTimeout.

## Implements

- [`Scheduler`](../interfaces/Scheduler.md)

## Constructors

### Constructor

> **new TimeoutScheduler**(`fps`): `TimeoutScheduler`

Defined in: [packages/core/src/infra/scheduler/TimeoutScheduler.ts:7](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/core/src/infra/scheduler/TimeoutScheduler.ts#L7)

#### Parameters

##### fps

`number` = `60`

#### Returns

`TimeoutScheduler`

## Methods

### start()

> **start**(`loop`): `void`

Defined in: [packages/core/src/infra/scheduler/TimeoutScheduler.ts:11](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/core/src/infra/scheduler/TimeoutScheduler.ts#L11)

#### Parameters

##### loop

(`now`) => `void`

#### Returns

`void`

#### Implementation of

[`Scheduler`](../interfaces/Scheduler.md).[`start`](../interfaces/Scheduler.md#start)

***

### stop()

> **stop**(): `void`

Defined in: [packages/core/src/infra/scheduler/TimeoutScheduler.ts:25](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/core/src/infra/scheduler/TimeoutScheduler.ts#L25)

#### Returns

`void`

#### Implementation of

[`Scheduler`](../interfaces/Scheduler.md).[`stop`](../interfaces/Scheduler.md#stop)
