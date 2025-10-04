[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / useAxis1D

# Function: useAxis1D()

> **useAxis1D**(`name`): () => `number`

Defined in: [packages/input/src/public/hooks.ts:60](https://github.com/jlehett/pulse-ts/blob/4869ef2c4af7bf37d31e2edd2d6d1ba148133fb2/packages/input/src/public/hooks.ts#L60)

Create an accessor for a 1D axis value.

## Parameters

### name

`string`

Axis name.

## Returns

A function that returns the latest numeric axis value.

> (): `number`

### Returns

`number`

## Example

```ts
import { useAxis1D } from '@pulse-ts/input';
const zoom = useAxis1D('zoom');
const value = zoom();
```
