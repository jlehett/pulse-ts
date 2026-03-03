# DOM Animation Forced Reflow in Game Loop

**Paths:** `demos/arena/src/nodes/**/*.ts`

## Problem

`useFrameUpdate` callbacks run inside the engine's `requestAnimationFrame` loop. When triggering CSS transitions from within these callbacks, a nested `requestAnimationFrame` can batch both style changes (the "start" state and the "transition back" state) into a single paint cycle. The browser never renders the intermediate state, making the animation invisible.

```typescript
// BROKEN: nested rAF may run in the same paint as the outer game-loop rAF
function flashPanel(panel: HTMLElement): void {
    panel.style.transition = 'none';
    panel.style.filter = 'brightness(2.0)';
    requestAnimationFrame(() => {
        // This may execute in the same frame — browser only sees brightness(1)
        panel.style.transition = 'filter 400ms ease-out';
        panel.style.filter = 'brightness(1)';
    });
}
```

## Solution: Forced Reflow

Use `void element.offsetHeight` (or any layout-triggering read) between setting the start state and the transition-back state. This forces the browser to commit the intermediate style before processing the transition.

```typescript
// CORRECT: forced reflow guarantees the bright state is painted
function flashPanel(panel: HTMLElement): void {
    panel.style.transition = 'none';
    panel.style.filter = 'brightness(2.0)';

    // Force reflow — browser commits brightness(2.0)
    void panel.offsetHeight;

    panel.style.transition = 'filter 400ms ease-out';
    panel.style.filter = 'brightness(1)';
}
```

## When This Applies

Any CSS transition triggered from:
- `useFrameUpdate` callbacks
- `useFixedUpdate` callbacks (if they manipulate DOM)
- Any code path that runs inside a `requestAnimationFrame` callback

The `requestAnimationFrame` nesting trick works fine when called from event handlers or timeouts (outside the game loop), but fails when already inside a rAF.

## Related

- `demos/arena/src/nodes/ScoreHudNode.ts` — score flash animation
- `demos/arena/src/overlayAnimations.ts` — overlay entrance/exit animations (these work because they're triggered from phase transitions, not continuously from the game loop)
