[**pulse-ts**](../../../README.md)

***

[pulse-ts](../../../README.md) / [input/src](../README.md) / useVirtualJoystick

# Function: useVirtualJoystick()

> **useVirtualJoystick**(`axisAction`, `options?`): [`VirtualJoystickHandle`](../interfaces/VirtualJoystickHandle.md)

Defined in: packages/input/src/public/useVirtualJoystick.ts

Creates a virtual joystick that injects into the input system's named axis action.
Handles touch ID tracking, displacement math, deadzone application,
input system injection, and cleanup.

The hook owns all touch math. Visual rendering is pluggable via the `render`
option; when omitted, a default circle + knob design is used.

## Parameters

### axisAction

`string`

The input action name to inject axis values into (via `holdAxis2D`).

### options?

[`VirtualJoystickOptions`](../interfaces/VirtualJoystickOptions.md)

Configuration and optional custom render callback.

## Returns

[`VirtualJoystickHandle`](../interfaces/VirtualJoystickHandle.md)

A handle for controlling visibility, reading axis values, and cleanup.

## Examples

```ts
import { useVirtualJoystick } from '@pulse-ts/input';

// Default visuals — zero config
const joystick = useVirtualJoystick('move', {
    position: 'bottom-left',
    size: 120,
    deadzone: 0.15,
});
```

```ts
import { useVirtualJoystick } from '@pulse-ts/input';

// Custom visuals via render callback
const joystick = useVirtualJoystick('move', {
    position: 'bottom-right',
    render: (state) => {
        const el = document.createElement('div');
        el.style.width = `${state.size}px`;
        el.style.height = `${state.size}px`;
        // Use state.knobX(), state.knobY(), state.active() for updates
        return el;
    },
});
```
