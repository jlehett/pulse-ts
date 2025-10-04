[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / useFixedEarly

# Function: useFixedEarly()

> **useFixedEarly**(`fn`, `opts`): `void`

Defined in: [packages/core/src/domain/fc/hooks.ts:141](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/fc/hooks.ts#L141)

Registers a fixed-step tick in the `early` phase.

- Runs at the world's fixed timestep (e.g., 60Hz), before `fixed.update`.
- Use for input sampling or pre-physics logic.

## Parameters

### fn

(`dt`) => `void`

Callback invoked with `dt` in seconds for the fixed step.

### opts

`TickOpts` = `{}`

Optional scheduling options (lower `order` runs earlier; default 0).

## Returns

`void`
