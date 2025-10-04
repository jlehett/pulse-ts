[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / useAxis2D

# Function: useAxis2D()

> **useAxis2D**(`name`): () => [`Vec`](../type-aliases/Vec.md)

Defined in: [packages/input/src/public/hooks.ts:77](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/input/src/public/hooks.ts#L77)

Create an accessor for a 2D axis vector.

## Parameters

### name

`string`

Axis2D name (e.g., `move`).

## Returns

A function that returns a `{[key:string]:number}` vector.

> (): [`Vec`](../type-aliases/Vec.md)

### Returns

[`Vec`](../type-aliases/Vec.md)

## Example

```ts
import { useAxis2D } from '@pulse-ts/input';
const move = useAxis2D('move');
const { x, y } = move();
```
