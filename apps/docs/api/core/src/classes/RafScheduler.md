[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / RafScheduler

# Class: RafScheduler

Defined in: [packages/core/src/infra/scheduler/RafScheduler.ts:6](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/core/src/infra/scheduler/RafScheduler.ts#L6)

A scheduler that uses requestAnimationFrame.

## Implements

- [`Scheduler`](../interfaces/Scheduler.md)

## Constructors

### Constructor

> **new RafScheduler**(): `RafScheduler`

#### Returns

`RafScheduler`

## Methods

### start()

> **start**(`loop`): `void`

Defined in: [packages/core/src/infra/scheduler/RafScheduler.ts:9](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/core/src/infra/scheduler/RafScheduler.ts#L9)

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

Defined in: [packages/core/src/infra/scheduler/RafScheduler.ts:17](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/core/src/infra/scheduler/RafScheduler.ts#L17)

#### Returns

`void`

#### Implementation of

[`Scheduler`](../interfaces/Scheduler.md).[`stop`](../interfaces/Scheduler.md#stop)
