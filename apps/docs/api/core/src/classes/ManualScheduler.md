[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / ManualScheduler

# Class: ManualScheduler

Defined in: [packages/core/src/infra/scheduler/ManualScheduler.ts:15](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/core/src/infra/scheduler/ManualScheduler.ts#L15)

A scheduler that uses a manual loop.

Useful for tests; call `step(nowMs?)` to drive the loop.

## Example

```ts
const sched = new ManualScheduler();
// loop = new EngineLoop({ scheduler: sched, ... }, hooks);
sched.step(); // drive one iteration with current time
```

## Implements

- [`Scheduler`](../interfaces/Scheduler.md)

## Constructors

### Constructor

> **new ManualScheduler**(): `ManualScheduler`

#### Returns

`ManualScheduler`

## Methods

### start()

> **start**(`loop`): `void`

Defined in: [packages/core/src/infra/scheduler/ManualScheduler.ts:18](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/core/src/infra/scheduler/ManualScheduler.ts#L18)

#### Parameters

##### loop

(`now`) => `void`

#### Returns

`void`

#### Implementation of

[`Scheduler`](../interfaces/Scheduler.md).[`start`](../interfaces/Scheduler.md#start)

***

### step()

> **step**(`nowMs?`): `void`

Defined in: [packages/core/src/infra/scheduler/ManualScheduler.ts:26](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/core/src/infra/scheduler/ManualScheduler.ts#L26)

#### Parameters

##### nowMs?

`number`

#### Returns

`void`

***

### stop()

> **stop**(): `void`

Defined in: [packages/core/src/infra/scheduler/ManualScheduler.ts:22](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/core/src/infra/scheduler/ManualScheduler.ts#L22)

#### Returns

`void`

#### Implementation of

[`Scheduler`](../interfaces/Scheduler.md).[`stop`](../interfaces/Scheduler.md#stop)
