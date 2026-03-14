# Approved: Input Binding Shorthand (`Axis2D.keys`)

> One-liner shorthands for common 2D axis bindings — WASD, arrow keys, and custom four-key layouts.

**Origin:** Engine Improvements #37 (Input Binding Shorthand).

---

## Summary

Add static shorthand methods to `Axis2D` in `@pulse-ts/input` for the most common 2D axis bindings. The full nested form remains available for custom configurations.

---

## Problem

`Axis2D` binding declarations require nested `Axis1D` + `Key` calls, making the most common input pattern (WASD movement) 3 lines of deeply nested constructor calls. Every game with keyboard movement has this pattern, and the verbosity is disproportionate to the simplicity of the concept.

---

## API

```typescript
namespace Axis2D {
    /**
     * Create a 2D axis from four key codes: left, right, down, up.
     * Equivalent to Axis2D({ x: Axis1D({ neg: Key(left), pos: Key(right) }),
     *                         y: Axis1D({ neg: Key(down), pos: Key(up) }) })
     *
     * @example
     * p1Move: Axis2D.keys('KeyA', 'KeyD', 'KeyS', 'KeyW'),
     */
    function keys(left: string, right: string, down: string, up: string): Axis2DBinding;

    /**
     * Create from WASD preset.
     *
     * @example
     * p1Move: Axis2D.wasd(),
     */
    function wasd(): Axis2DBinding;

    /**
     * Create from arrow keys preset.
     *
     * @example
     * p2Move: Axis2D.arrows(),
     */
    function arrows(): Axis2DBinding;
}
```

---

## Usage Examples

### Before

```typescript
export const allBindings = {
    p1Move: Axis2D({
        x: Axis1D({ pos: Key('KeyD'), neg: Key('KeyA') }),
        y: Axis1D({ pos: Key('KeyW'), neg: Key('KeyS') }),
    }),
    p1Dash: Key('Space'),
    p2Move: Axis2D({
        x: Axis1D({ pos: Key('ArrowRight'), neg: Key('ArrowLeft') }),
        y: Axis1D({ pos: Key('ArrowUp'), neg: Key('ArrowDown') }),
    }),
    p2Dash: Key('Enter'),
    pause: Key('Escape'),
};
```

### After

```typescript
export const allBindings = {
    p1Move: Axis2D.wasd(),
    p1Dash: Key('Space'),
    p2Move: Axis2D.arrows(),
    p2Dash: Key('Enter'),
    pause: Key('Escape'),
};

// Custom key layout
ijklMove: Axis2D.keys('KeyJ', 'KeyL', 'KeyK', 'KeyI'),
```

---

## Design Decisions

- **Static methods on `Axis2D`** — Discoverable via the existing API. No new imports needed.
- **`keys()` parameter order: left, right, down, up** — Matches the mental model of X-axis first (left/right), then Y-axis (down/up).
- **Full form still available** — `Axis2D({ x: Axis1D(...), y: Axis1D(...) })` remains for custom configurations (e.g., mixed keyboard + gamepad axes).
- **`wasd()` and `arrows()` presets** — The two most common movement bindings in games. Zero-config for the standard case.
