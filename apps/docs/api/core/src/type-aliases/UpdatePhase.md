[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / UpdatePhase

# Type Alias: UpdatePhase

> **UpdatePhase** = `"early"` \| `"update"` \| `"late"`

Defined in: [packages/core/src/domain/ecs/base/types.ts:19](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/core/src/domain/ecs/base/types.ts#L19)

The phase of the update. Phases are run in the following order:
1. `early`
2. `update`
3. `late`
