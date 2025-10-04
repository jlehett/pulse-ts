[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / useAxis1D

# Function: useAxis1D()

> **useAxis1D**(`name`): () => `number`

Defined in: [packages/input/src/public/hooks.ts:60](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/public/hooks.ts#L60)

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
