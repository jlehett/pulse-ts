[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / useAxis1D

# Function: useAxis1D()

> **useAxis1D**(`name`): () => `number`

Defined in: packages/input/src/public/hooks.ts:60

Get the axis state for a given axis name.

## Parameters

### name

`string`

The name of the axis.

## Returns

The axis value accessor.

Example
```ts
import { useAxis1D } from '@pulse-ts/input';
const zoom = useAxis1D('zoom');
const value = zoom();
```

> (): `number`

### Returns

`number`
