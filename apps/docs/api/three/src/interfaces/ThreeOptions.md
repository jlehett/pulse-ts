[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [three/src](../README.md) / ThreeOptions

# Interface: ThreeOptions

Defined in: [packages/three/src/domain/services/Three.ts:14](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/three/src/domain/services/Three.ts#L14)

Options for configuring the Three.js integration.

## Properties

### autoCommitTransforms?

> `optional` **autoCommitTransforms**: `boolean`

Defined in: [packages/three/src/domain/services/Three.ts:26](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/three/src/domain/services/Three.ts#L26)

Auto-install `ThreeTRSSyncSystem` to push transforms before render. Default: `true`.

***

### canvas

> **canvas**: `HTMLCanvasElement`

Defined in: [packages/three/src/domain/services/Three.ts:18](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/three/src/domain/services/Three.ts#L18)

The target canvas to render into.

***

### clearColor?

> `optional` **clearColor**: `number`

Defined in: [packages/three/src/domain/services/Three.ts:22](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/three/src/domain/services/Three.ts#L22)

Scene clear color (hex RGB). Default: `0x000000`.

***

### enableCulling?

> `optional` **enableCulling**: `boolean`

Defined in: [packages/three/src/domain/services/Three.ts:34](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/three/src/domain/services/Three.ts#L34)

Respect core `Visibility` to hide Three roots. Default: `true`.

***

### useMatrices?

> `optional` **useMatrices**: `boolean`

Defined in: [packages/three/src/domain/services/Three.ts:30](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/three/src/domain/services/Three.ts#L30)

Use explicit matrix composition on roots (sets `matrixAutoUpdate=false`). Default: `false`.
