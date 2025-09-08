[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / useFixedUpdate

# Function: useFixedUpdate()

> **useFixedUpdate**(`fn`, `opts`): `void`

Defined in: [core/src/fc/hooks.ts:118](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/fc/hooks.ts#L118)

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
