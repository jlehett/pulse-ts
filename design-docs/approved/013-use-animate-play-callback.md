# Approved: `useAnimate` Play Callback Enhancement

> Add an optional callback to `play()` for fire-and-forget animation consumption.

**Origin:** Engine Improvements #13 (`useTween`), refined into a small enhancement to existing `useAnimate`.

---

## Summary

Enhance `useAnimate`'s `play()` method to accept an optional callback that is invoked each frame with the current animated value. Eliminates the need for a separate `useFrameUpdate` + manual `.value` read in fire-and-forget scenarios.

---

## Problem

The current pattern for consuming an animated value requires a separate `useFrameUpdate` callback:

```typescript
const flash = useAnimate({ from: 2.0, to: 1.0, duration: 0.5, easing: 'ease-out' });
flash.play();

useFrameUpdate(() => {
    panel.style.filter = `brightness(${flash.value})`;
});
```

For fire-and-forget animations (flash a panel, scale-pop a number, fade an element), this is unnecessarily verbose. The animation and its consumer are split across two locations.

---

## Change

```typescript
// Current signature
play(): void;

// Enhanced signature
play(onUpdate?: (value: number) => void): void;
```

When `onUpdate` is provided, it is called each frame with the current animated value. This works across all animation modes (tween, oscillation, rate).

---

## Usage Examples

### Tween — fire and forget

```typescript
const flash = useAnimate({ from: 2.0, to: 1.0, duration: 0.5, easing: 'ease-out' });

function flashPanel(panel: HTMLElement) {
    flash.play((v) => { panel.style.filter = `brightness(${v})`; });
}
```

### Multiple properties from one tween

```typescript
const pop = useAnimate({ from: 1.35, to: 1.0, duration: 0.5, easing: 'ease-out' });

function scalePop(el: HTMLElement) {
    pop.play((v) => { el.style.transform = `scale(${v})`; });
}
```

### Oscillation with callback

```typescript
const pulse = useAnimate({ wave: 'sine', min: 0.4, max: 1.5, frequency: 1.5 });
pulse.play((v) => { material.emissiveIntensity = v; });
```

### Existing usage unchanged

```typescript
// Still works — .value is still available, play() without callback is unchanged
const spin = useAnimate({ rate: 2 });
spin.play();

useFrameUpdate(() => {
    mesh.rotation.y = spin.value;
});
```

---

## Design Decisions

- **Enhancement, not a new hook** — `useAnimate` already supports tweens with `from`/`to`/`duration`/`easing`. A separate `useTween` hook would be redundant.
- **Callback on `play()`, not on options** — The callback is about how you consume the value, not about the animation configuration. Placing it on `play()` also allows changing the callback on replay.
- **Works across all modes** — Not limited to tweens. Oscillations and rate animations can also use the callback pattern.
- **Backward compatible** — `play()` with no arguments continues to work exactly as before.
