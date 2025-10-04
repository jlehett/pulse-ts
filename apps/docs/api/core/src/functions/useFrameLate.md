[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / useFrameLate

# Function: useFrameLate()

> **useFrameLate**(`fn`, `opts`): `void`

Defined in: [packages/core/src/domain/fc/hooks.ts:217](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/core/src/domain/fc/hooks.ts#L217)

Registers a frame tick in the `late` phase.

- Runs last in the frame pipeline.
- Use for cleanup or rendering-adjacent logic.

## Parameters

### fn

(`dt`) => `void`

Callback invoked with `dt` in seconds for the variable frame step.

### opts

`TickOpts` = `{}`

Optional scheduling options (lower `order` runs earlier; default 0).

## Returns

`void`
