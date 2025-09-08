[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / useFixedLate

# Function: useFixedLate()

> **useFixedLate**(`fn`, `opts`): `void`

Defined in: [core/src/fc/hooks.ts:131](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/fc/hooks.ts#L131)

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
