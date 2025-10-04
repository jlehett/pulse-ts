[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [three/src](../README.md) / installThree

# Function: installThree()

> **installThree**(`world`, `opts`): [`ThreeService`](../classes/ThreeService.md)

Defined in: [packages/three/src/public/install.ts:28](https://github.com/jlehett/pulse-ts/blob/b287bc18de1bbb78a8cc43f602a646e458610bc3/packages/three/src/public/install.ts#L28)

Convenience installer for Three.js rendering.

- Provides a shared `ThreeService` (renderer + scene + camera).
- Installs default systems: `ThreeCameraPVSystem`, `ThreeTRSSyncSystem` (opt-in via options), and `ThreeRenderSystem`.

## Parameters

### world

`World`

The `World` to install into.

### opts

[`ThreeOptions`](../interfaces/ThreeOptions.md)

Options to configure the Three service.

## Returns

[`ThreeService`](../classes/ThreeService.md)

The created `ThreeService` bound to the world.

## Example

```ts
import { World } from '@pulse-ts/core';
import { installThree } from '@pulse-ts/three';

const world = new World();
const canvas = document.createElement('canvas');
const three = installThree(world, { canvas, clearColor: 0x101218 });
world.start();
```
