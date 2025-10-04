[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / useFixedLate

# Function: useFixedLate()

> **useFixedLate**(`fn`, `opts`): `void`

Defined in: [packages/core/src/domain/fc/hooks.ts:167](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/core/src/domain/fc/hooks.ts#L167)

Registers a fixed-step tick in the `late` phase.

- Runs last in the fixed pipeline.
- Use for post-physics adjustments or housekeeping.

## Parameters

### fn

(`dt`) => `void`

Callback invoked with `dt` in seconds for the fixed step.

### opts

`TickOpts` = `{}`

Optional scheduling options (lower `order` runs earlier; default 0).

## Returns

`void`
