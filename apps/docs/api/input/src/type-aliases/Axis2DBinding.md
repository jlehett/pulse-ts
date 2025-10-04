[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / Axis2DBinding

# Type Alias: Axis2DBinding

> **Axis2DBinding** = `object`

Defined in: packages/input/src/domain/bindings/types.ts:140

An axis 2D binding.

## Properties

### axes

> **axes**: `Record`\<`string`, [`Axis1DBinding`](Axis1DBinding.md)\>

Defined in: packages/input/src/domain/bindings/types.ts:145

The axes of the axis 2D binding. Each key is the name of the axis, and the value is the axis definition.

***

### invertX?

> `optional` **invertX**: `boolean`

Defined in: packages/input/src/domain/bindings/types.ts:147

Optional inversion for first component (commonly x).

***

### invertY?

> `optional` **invertY**: `boolean`

Defined in: packages/input/src/domain/bindings/types.ts:149

Optional inversion for second component (commonly y).

***

### type

> **type**: `"axis2d"`

Defined in: packages/input/src/domain/bindings/types.ts:141
