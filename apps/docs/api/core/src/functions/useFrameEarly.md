[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / useFrameEarly

# Function: useFrameEarly()

> **useFrameEarly**(`fn`, `opts`): `void`

Defined in: [core/src/fc/hooks.ts:144](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/fc/hooks.ts#L144)

Registers a frame tick in the `early` phase.

- Runs once per rendered frame before `frame.update`.
- Use for input sampling or preparation work.

## Parameters

### fn

(`dt`) => `void`

Callback invoked with `dt` in seconds for the variable frame step.

### opts

`TickOpts` = `{}`

Optional scheduling options (lower `order` runs earlier; default 0).

## Returns

`void`
