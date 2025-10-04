[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / Axis2DBinding

# Type Alias: Axis2DBinding

> **Axis2DBinding** = `object`

Defined in: [packages/input/src/domain/bindings/types.ts:155](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/domain/bindings/types.ts#L155)

An axis 2D binding expression.

## Properties

### axes

> **axes**: `Record`\<`string`, [`Axis1DBinding`](Axis1DBinding.md)\>

Defined in: [packages/input/src/domain/bindings/types.ts:160](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/domain/bindings/types.ts#L160)

The axes of the axis 2D binding. Each key is the name of the axis, and the value is the axis definition.

***

### invertX?

> `optional` **invertX**: `boolean`

Defined in: [packages/input/src/domain/bindings/types.ts:162](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/domain/bindings/types.ts#L162)

Optional inversion for first component (commonly x).

***

### invertY?

> `optional` **invertY**: `boolean`

Defined in: [packages/input/src/domain/bindings/types.ts:164](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/domain/bindings/types.ts#L164)

Optional inversion for second component (commonly y).

***

### type

> **type**: `"axis2d"`

Defined in: [packages/input/src/domain/bindings/types.ts:156](https://github.com/jlehett/pulse-ts/blob/a2a18767041a6b69ca4c5f6131d2de266097750e/packages/input/src/domain/bindings/types.ts#L156)
