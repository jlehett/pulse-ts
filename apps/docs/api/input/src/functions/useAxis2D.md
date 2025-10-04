[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / useAxis2D

# Function: useAxis2D()

> **useAxis2D**(`name`): () => [`Vec`](../type-aliases/Vec.md)

Defined in: packages/input/src/public/hooks.ts:77

Get the axis 2D state for a given axis name.

## Parameters

### name

`string`

The name of the axis 2D.

## Returns

The axis 2D accessor.

Example
```ts
import { useAxis2D } from '@pulse-ts/input';
const move = useAxis2D('move');
const { x, y } = move();
```

> (): [`Vec`](../type-aliases/Vec.md)

### Returns

[`Vec`](../type-aliases/Vec.md)
