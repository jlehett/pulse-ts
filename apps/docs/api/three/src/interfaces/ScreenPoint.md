[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [three/src](../README.md) / ScreenPoint

# Interface: ScreenPoint

Defined in: packages/three/src/public/useScreenProjection.ts

A projected point in screen space.

## Properties

### x

> **x**: `number`

Screen-space X in pixels (0 = left edge).

***

### y

> **y**: `number`

Screen-space Y in pixels (0 = top edge).

***

### depth

> **depth**: `number`

Normalized depth (0 = near, 1 = far). Useful for z-sorting overlays.

***

### visible

> **visible**: `boolean`

Whether the point is in front of the camera.
