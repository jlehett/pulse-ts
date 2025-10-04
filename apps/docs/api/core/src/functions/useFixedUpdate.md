[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / useFixedUpdate

# Function: useFixedUpdate()

> **useFixedUpdate**(`fn`, `opts`): `void`

Defined in: [packages/core/src/domain/fc/hooks.ts:154](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/core/src/domain/fc/hooks.ts#L154)

Registers a fixed-step tick in the `update` phase.

- Runs at the world's fixed timestep after `fixed.early` and before `fixed.late`.
- Use for core simulation/physics.

## Parameters

### fn

(`dt`) => `void`

Callback invoked with `dt` in seconds for the fixed step.

### opts

`TickOpts` = `{}`

Optional scheduling options (lower `order` runs earlier; default 0).

## Returns

`void`
