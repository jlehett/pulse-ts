[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / JoystickRenderState

# Interface: JoystickRenderState

Defined in: packages/input/src/public/useVirtualJoystick.ts

Reactive state passed to a custom joystick render callback.
All value accessors are functions (reactive getters) so they integrate
with reactive DOM binding systems.

## Properties

### knobX

> **knobX**: () => `number`

Knob offset in pixels from center (-maxOffset to +maxOffset). Reactive getter.

### knobY

> **knobY**: () => `number`

Knob offset in pixels from center (-maxOffset to +maxOffset). Reactive getter.

### axisX

> **axisX**: () => `number`

Normalized axis after deadzone (-1 to 1). Reactive getter.

### axisY

> **axisY**: () => `number`

Normalized axis after deadzone (-1 to 1). Reactive getter.

### active

> **active**: () => `boolean`

Whether a touch is currently active. Reactive getter.

### size

> **size**: `number`

Base size in pixels.
