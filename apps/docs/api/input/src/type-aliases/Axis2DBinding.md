[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / Axis2DBinding

# Type Alias: Axis2DBinding

> **Axis2DBinding** = `object`

Defined in: [input/src/bindings/types.ts:140](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/input/src/bindings/types.ts#L140)

An axis 2D binding.

## Properties

### axes

> **axes**: `Record`\<`string`, [`Axis1DBinding`](Axis1DBinding.md)\>

Defined in: [input/src/bindings/types.ts:145](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/input/src/bindings/types.ts#L145)

The axes of the axis 2D binding. Each key is the name of the axis, and the value is the axis definition.

***

### invertX?

> `optional` **invertX**: `boolean`

Defined in: [input/src/bindings/types.ts:147](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/input/src/bindings/types.ts#L147)

Optional inversion for first component (commonly x).

***

### invertY?

> `optional` **invertY**: `boolean`

Defined in: [input/src/bindings/types.ts:149](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/input/src/bindings/types.ts#L149)

Optional inversion for second component (commonly y).

***

### type

> **type**: `"axis2d"`

Defined in: [input/src/bindings/types.ts:141](https://github.com/jlehett/pulse-ts/blob/95f7e0ab0aafbcd2aad691251c554317b3dfe19c/packages/input/src/bindings/types.ts#L141)
