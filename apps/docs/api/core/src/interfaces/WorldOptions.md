[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / WorldOptions

# Interface: WorldOptions

Defined in: [packages/core/src/domain/world/world.ts:34](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/core/src/domain/world/world.ts#L34)

Options for the World class.

## Properties

### fixedStepMs?

> `optional` **fixedStepMs**: `number`

Defined in: [packages/core/src/domain/world/world.ts:38](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/core/src/domain/world/world.ts#L38)

The fixed step time in milliseconds.

***

### maxFixedStepsPerFrame?

> `optional` **maxFixedStepsPerFrame**: `number`

Defined in: [packages/core/src/domain/world/world.ts:46](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/core/src/domain/world/world.ts#L46)

The maximum number of fixed steps per frame.

***

### maxFrameDtMs?

> `optional` **maxFrameDtMs**: `number`

Defined in: [packages/core/src/domain/world/world.ts:50](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/core/src/domain/world/world.ts#L50)

The maximum frame delta time in milliseconds.

***

### scheduler?

> `optional` **scheduler**: [`Scheduler`](Scheduler.md)

Defined in: [packages/core/src/domain/world/world.ts:42](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/core/src/domain/world/world.ts#L42)

The scheduler to use.
