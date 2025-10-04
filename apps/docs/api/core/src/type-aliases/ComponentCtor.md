[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [core/src](../README.md) / ComponentCtor

# Type Alias: ComponentCtor()\<T\>

> **ComponentCtor**\<`T`\> = () => `T`

Defined in: [packages/core/src/domain/ecs/base/types.ts:56](https://github.com/jlehett/pulse-ts/blob/d786433c7cb88fe7c30a7029f46dff58815931cc/packages/core/src/domain/ecs/base/types.ts#L56)

A component constructor type, constrained to Pulse components.

Use this alias for typed component constructor arrays in queries and helpers.

## Type Parameters

### T

`T` *extends* [`Component`](../classes/Component.md) = [`Component`](../classes/Component.md)

## Returns

`T`

## Example

```ts
import { type ComponentCtor } from '@pulse-ts/core';
import { Transform, Bounds } from '@pulse-ts/core';
const has: readonly ComponentCtor[] = [Transform, Bounds];
```
