---
paths:
  - "demos/arena/src/nodes/**/*Node.ts"
---
# DOM Overlay Initial Visibility Flash

## Problem

DOM overlay elements appended to the DOM with default visible state will flash for 1+ frames before `useFrameUpdate` first runs. Example: scoreboard appears at full opacity during intro cinematic before `useFrameUpdate` hides it.

### Why It Happens

1. Element is created and appended with `opacity: '1'` (default)
2. Browser paints the element
3. Next animation frame: `useFrameUpdate` runs and sets `opacity: '0'` to match game phase
4. **Result:** Element is visible for 1+ frames at full opacity before being hidden

## Solution

Set initial `opacity` at element creation time based on current game phase. The element will be hidden from the first paint.

```typescript
// CORRECT: hidden from the first paint
const el = document.createElement('div');
Object.assign(el.style, {
  opacity: gameState.phase === 'intro' ? '0' : '1',
  transition: 'opacity 300ms ease',
  // ... other styles
});
container.appendChild(el);

// useFrameUpdate still updates opacity based on phase
useFrameUpdate(() => {
  el.style.opacity = gameState.phase === 'intro' ? '0' : '1';
});
```

### Anti-Pattern

```typescript
// WRONG: relies on useFrameUpdate to hide — flashes for 1+ frames
Object.assign(el.style, {
  transition: 'opacity 300ms ease',
  // opacity not set, defaults to 1
});
container.appendChild(el);

useFrameUpdate(() => {
  // Too late — element already painted at opacity 1
  el.style.opacity = gameState.phase === 'intro' ? '0' : '1';
});
```

## When This Applies

Any DOM overlay node that:
- Conditionally hides/shows based on game phase (intro, gameplay, replay, etc.)
- Must remain invisible during certain phases from the moment it's created
- Uses `useFrameUpdate` to toggle visibility

## Related

- `dom-animation-forced-reflow.md` — For CSS transition timing within the game loop
- `deferred-hud-animation.md` — For coordinating animations with visibility transitions
