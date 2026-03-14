# Approved: Virtual Joystick Hook (`useVirtualJoystick`)

> Touch-based virtual joystick with input injection, pluggable visuals, and automatic touch tracking.

**Origin:** Engine Improvements #15 (`useVirtualJoystick`).

---

## Summary

A new `useVirtualJoystick` hook in `@pulse-ts/input` that handles all touch math (tracking, displacement, deadzone, input injection) and exposes state to a pluggable visual layer. Ships with sensible default visuals, but users can provide a custom render component for full visual control.

---

## Problem

TouchControlsNode implements a complete virtual joystick from scratch — ~120 lines of DOM creation, touch ID tracking, displacement computation, deadzone application, visual feedback, and input injection. This is fiddly, error-prone boilerplate that every mobile game needs. Getting touch ID management and deadzone math right is non-trivial.

---

## API

### `useVirtualJoystick`

```typescript
interface VirtualJoystickOptions {
    /** Screen position preset or custom coordinates. Default: 'bottom-left'. */
    position?: 'bottom-left' | 'bottom-right' | { x: string; y: string };
    /** Outer diameter in pixels. Default: 120. */
    size?: number;
    /** Deadzone radius (0–1). Below this, output is zero. Default: 0.15. */
    deadzone?: number;
    /** Parent element. Default: renderer's parent element. */
    parent?: HTMLElement;
    /** Custom render component. Receives reactive state. Omit for default visuals. */
    render?: (state: JoystickRenderState) => JSX.Element;
}

interface JoystickRenderState {
    /** Knob offset in pixels from center (-maxOffset to +maxOffset). Reactive getter. */
    knobX: () => number;
    /** Knob offset in pixels from center (-maxOffset to +maxOffset). Reactive getter. */
    knobY: () => number;
    /** Normalized axis after deadzone (-1 to 1). Reactive getter. */
    axisX: () => number;
    /** Normalized axis after deadzone (-1 to 1). Reactive getter. */
    axisY: () => number;
    /** Whether a touch is currently active. Reactive getter. */
    active: () => boolean;
    /** Base size in pixels. */
    size: number;
}

interface VirtualJoystickHandle {
    /** The root DOM element (for custom positioning/visibility). */
    readonly element: HTMLElement;
    /** Current axis values after deadzone. */
    readonly axes: { x: number; y: number };
    /** Show/hide the joystick. */
    setVisible(visible: boolean): void;
}

/**
 * Creates a virtual joystick that injects into the input system's named axis.
 * Handles touch ID tracking, displacement math, deadzone application,
 * input system injection, and cleanup.
 *
 * @param axisAction - The input action name to inject axis values into.
 * @param options - Configuration and optional custom render component.
 * @returns A handle for controlling visibility and reading axis values.
 *
 * @example
 * // Default visuals — zero config
 * useVirtualJoystick(moveAction, {
 *     position: 'bottom-left',
 *     size: 120,
 *     deadzone: 0.15,
 * });
 *
 * @example
 * // Custom visuals — user-provided render component
 * useVirtualJoystick(moveAction, {
 *     position: 'bottom-left',
 *     size: 120,
 *     deadzone: 0.15,
 *     render: (state) => (
 *         <svg width={state.size} height={state.size}>
 *             <circle cx="60" cy="60" r="55" fill="none" stroke="rgba(255,255,255,0.2)" />
 *             <circle
 *                 cx={() => 60 + state.knobX()}
 *                 cy={() => 60 + state.knobY()}
 *                 r="20"
 *                 fill={() => state.active() ? '#48c9b0' : 'rgba(255,255,255,0.4)'}
 *             />
 *         </svg>
 *     ),
 * });
 */
function useVirtualJoystick(
    axisAction: string,
    options?: VirtualJoystickOptions,
): VirtualJoystickHandle;
```

---

## Usage Examples

### Simple — default visuals

```typescript
import { useVirtualJoystick } from '@pulse-ts/input';

// Just works
useVirtualJoystick(moveAction, {
    position: 'bottom-left',
});
```

### Custom image-based joystick

```typescript
useVirtualJoystick(moveAction, {
    position: 'bottom-left',
    size: 120,
    deadzone: 0.15,
    render: (state) => (
        <div style={{ width: `${state.size}px`, height: `${state.size}px`, position: 'relative' }}>
            <img src="joystick-base.png" style={{ width: '100%', height: '100%' }} />
            <img
                src="joystick-knob.png"
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: () => `translate(calc(-50% + ${state.knobX()}px), calc(-50% + ${state.knobY()}px))`,
                    opacity: () => state.active() ? '1' : '0.5',
                }}
            />
        </div>
    ),
});
```

### Phase-gated visibility

```typescript
const joystick = useVirtualJoystick(moveAction, { position: 'bottom-left' });

useWatch(() => gameState.phase, (phase) => {
    joystick.setVisible(phase === 'playing');
});
```

---

## Architecture

The hook is split into two layers:

1. **Touch math layer** (internal) — Handles touch ID tracking, displacement computation, deadzone application, input system injection. This is the core logic that users never need to rewrite.
2. **Visual layer** (pluggable) — Renders the joystick UI. Receives reactive state from the math layer. Defaults to a circle + knob design. Users swap this out by providing a `render` component.

Reactive getters (`knobX()`, `active()`, etc.) integrate with the `@pulse-ts/dom` package's reactive binding system — the render component runs once at mount, and getter values update each frame via dirty-checking.

---

## Design Decisions

- **Pluggable visuals via `render`** — Deep visual customization (SVG, images, custom shapes) is possible without fighting style overrides. The hook never constrains what the joystick looks like.
- **Default visuals when `render` is omitted** — Simple cases stay simple. No render component needed for the standard circle + knob design.
- **Hook owns the math** — Touch ID management, deadzone, and input injection are non-trivial and universal. These should never be reimplemented by users.
- **Reactive getters in render state** — Functions rather than raw values, so they work with the DOM package's reactive binding system. The render component builds DOM once; values update automatically.
