[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / useFrameUpdate

# Function: useFrameUpdate()

> **useFrameUpdate**(`fn`, `opts`): `void`

Defined in: [core/src/fc/hooks.ts:157](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/core/src/fc/hooks.ts#L157)

Registers a frame tick in the `update` phase.

- Runs once per rendered frame after `frame.early` and before `frame.late`.
- Use for animation and per-frame logic.

## Parameters

### fn

(`dt`) => `void`

Callback invoked with `dt` in seconds for the variable frame step.

### opts

`TickOpts` = `{}`

Optional scheduling options (lower `order` runs earlier; default 0).

## Returns

`void`
