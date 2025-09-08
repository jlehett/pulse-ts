[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / useFixedEarly

# Function: useFixedEarly()

> **useFixedEarly**(`fn`, `opts`): `void`

Defined in: [core/src/fc/hooks.ts:105](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/fc/hooks.ts#L105)

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
