[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / VirtualJoystickHandle

# Interface: VirtualJoystickHandle

Defined in: packages/input/src/public/useVirtualJoystick.ts

Handle returned by `useVirtualJoystick` for controlling the joystick.

## Properties

### element

> `readonly` **element**: `HTMLElement`

The root DOM element containing the joystick.

### axes

> `readonly` **axes**: \{ `x`: `number`; `y`: `number` \}

Current axis values after deadzone (-1 to 1 each).

## Methods

### setVisible()

> **setVisible**(`visible`): `void`

Show or hide the joystick.

#### Parameters

##### visible

`boolean`

### destroy()

> **destroy**(): `void`

Remove the joystick from the DOM and detach all listeners.
