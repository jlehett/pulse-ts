[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / PointerVec2Modifiers

# Type Alias: PointerVec2Modifiers

> **PointerVec2Modifiers** = `object`

Defined in: [packages/input/src/domain/bindings/types.ts:80](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/input/src/domain/bindings/types.ts#L80)

Modifiers that affect pointer movement mapping to an Axis2D.
Moved to bindings types so both registry and service can use a shared shape.

## Properties

### invertX?

> `optional` **invertX**: `boolean`

Defined in: [packages/input/src/domain/bindings/types.ts:82](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/input/src/domain/bindings/types.ts#L82)

Invert the first component (typically x).

***

### invertY?

> `optional` **invertY**: `boolean`

Defined in: [packages/input/src/domain/bindings/types.ts:84](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/input/src/domain/bindings/types.ts#L84)

Invert the second component (typically y).

***

### scaleX?

> `optional` **scaleX**: `number`

Defined in: [packages/input/src/domain/bindings/types.ts:86](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/input/src/domain/bindings/types.ts#L86)

Scale applied to the first component (x).

***

### scaleY?

> `optional` **scaleY**: `number`

Defined in: [packages/input/src/domain/bindings/types.ts:88](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/input/src/domain/bindings/types.ts#L88)

Scale applied to the second component (y).
