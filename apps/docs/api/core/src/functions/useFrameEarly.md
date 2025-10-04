[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / useFrameEarly

# Function: useFrameEarly()

> **useFrameEarly**(`fn`, `opts`): `void`

Defined in: [packages/core/src/domain/fc/hooks.ts:180](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/fc/hooks.ts#L180)

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
