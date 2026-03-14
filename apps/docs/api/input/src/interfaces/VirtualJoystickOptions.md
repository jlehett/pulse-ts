[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / VirtualJoystickOptions

# Interface: VirtualJoystickOptions

Defined in: packages/input/src/public/useVirtualJoystick.ts

Configuration options for `useVirtualJoystick`.

## Properties

### position?

> `optional` **position**: `'bottom-left'` \| `'bottom-right'` \| \{ `x`: `string`; `y`: `string` \}

Screen position preset or custom CSS coordinates. Default: `'bottom-left'`.

### size?

> `optional` **size**: `number`

Outer diameter in pixels. Default: `120`.

### deadzone?

> `optional` **deadzone**: `number`

Deadzone radius as a fraction (0-1). Below this threshold, output is zero. Default: `0.15`.

### parent?

> `optional` **parent**: `HTMLElement`

Parent element to append the joystick to. Default: `document.body`.

### render?

> `optional` **render**: (`state`: [`JoystickRenderState`](JoystickRenderState.md)) => `HTMLElement`

Custom render callback. Receives reactive state. Omit for default circle + knob visuals.
