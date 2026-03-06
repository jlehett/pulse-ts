---
paths:
  - "demos/arena/src/**/*OverlayNode.ts"
  - "demos/arena/src/overlayAnimations.ts"
---
# Overlay Transform Preservation Convention

## Problem

DOM overlay elements (MatchOverOverlayNode, DisconnectOverlayNode, CountdownOverlayNode, KnockoutOverlayNode) use CSS `transform` for centering via inline styles:

```js
Object.assign(el.style, {
  position: 'absolute',
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  // ...
})
```

Animation utilities (e.g., `applyEntrance` in `overlayAnimations.ts`) that manipulate `el.style.transform` must **preserve** the base centering transform, or animations will break the layout.

## Solution Pattern

Always capture and restore the base transform:

```js
const base = el.style.transform || '';
el.style.transform = `${base} translateY(-100px)`;  // animated state
// ... later, on completion:
el.style.transform = base;  // restore centering
```

### Why This Works

- **Base** holds the centering (`translate(-50%, -50%)`)
- **Animated state** composes: centering + animation (`translate(-50%, -50%) translateY(...)`)
- **Final state** restores base to remove animation, keep centering

## When Applying This

- Any `applyEntrance`, `applyExit`, or custom animation in `overlayAnimations.ts`
- Any helper that directly assigns to `el.style.transform`
- Do NOT blindly overwrite; always compose and restore

## Related Files

- `demos/arena/src/ui/overlays/MatchOverOverlayNode.ts`
- `demos/arena/src/ui/overlays/DisconnectOverlayNode.ts`
- `demos/arena/src/ui/overlays/CountdownOverlayNode.ts`
- `demos/arena/src/ui/overlays/KnockoutOverlayNode.ts`
- `demos/arena/src/ui/overlayAnimations.ts`
