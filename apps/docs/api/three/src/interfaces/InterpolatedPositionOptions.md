[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [three/src](../README.md) / InterpolatedPositionOptions

# Interface: InterpolatedPositionOptions

Defined in: packages/three/src/public/useInterpolatedPosition.ts

Options for `useInterpolatedPosition`.

## Properties

### getAlpha?

> `optional` **getAlpha**: () => `number`

Override the alpha source. When omitted, uses `world.getAmbientAlpha()`.

***

### snap?

> `optional` **snap**: () => `boolean`

When this returns `true`, skip interpolation and snap the target
directly to the source position. Useful for teleports and round resets
where interpolating between the old and new position would cause a
visible sweep.
