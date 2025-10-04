[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / UpdatePhase

# Type Alias: UpdatePhase

> **UpdatePhase** = `"early"` \| `"update"` \| `"late"`

Defined in: [packages/core/src/domain/ecs/base/types.ts:19](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/core/src/domain/ecs/base/types.ts#L19)

The phase of the update. Phases are run in the following order:
1. `early`
2. `update`
3. `late`
