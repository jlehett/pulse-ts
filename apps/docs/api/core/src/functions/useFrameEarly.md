[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / useFrameEarly

# Function: useFrameEarly()

> **useFrameEarly**(`fn`, `opts`): `void`

Defined in: [packages/core/src/domain/fc/hooks.ts:180](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/core/src/domain/fc/hooks.ts#L180)

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
