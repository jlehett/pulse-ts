---
paths:
  - "demos/arena/src/isMobileDevice.ts"
  - "demos/arena/src/nodes/TouchControlsNode.ts"
  - "demos/arena/src/landscapeEnforcer.ts"
  - "demos/arena/src/autoFullscreen.ts"
---
# Arena Mobile Device Detection Pattern

## Detection Rule

The arena demo uses `isMobileDevice()` as the canonical mobile detection utility. **Always import and call this function** rather than rolling custom detection logic.

## Primary Signal: `pointer: coarse`

The function checks `window.matchMedia('(pointer: coarse)')` first. This correctly identifies:
- Phones and tablets as mobile (returns `true`)
- Desktop/laptop including touch-enabled laptops as non-mobile (returns `false`)

**Why this works:** Touch-enabled laptops report `pointer: fine` for their primary input (trackpad/mouse), so they are correctly excluded from mobile-only features.

## Fallback: `navigator.maxTouchPoints`

When `matchMedia` is unavailable (rare), fallback to `navigator.maxTouchPoints > 0`. **Note:** This fallback alone is insufficient in production — it would misidentify touch-enabled laptops as mobile devices. Only use it when `matchMedia` is truly unavailable.

## Anti-Pattern

**Do NOT use `navigator.maxTouchPoints` directly** as a standalone mobile check. This incorrectly flags touch-enabled Windows laptops and hybrid devices as mobile.

## Usage

Three consumers depend on `isMobileDevice()`:

1. **`TouchControlsNode.ts`** — Renders virtual joystick and action buttons only on mobile
2. **`landscapeEnforcer.ts`** — Enforces landscape orientation and shows portrait overlay
3. **`autoFullscreen.ts`** — Auto-enters fullscreen on first touch

Each gates its initialization with:
```ts
if (!isMobileDevice()) return;
```

## Testing `isMobileDevice()`

Mock `window.matchMedia` to return `{ matches: true/false }` for the `(pointer: coarse)` query:

```ts
window.matchMedia = jest.fn().mockReturnValue({ matches: true });  // mobile
window.matchMedia = jest.fn().mockReturnValue({ matches: false }); // desktop
```

When testing the fallback path, temporarily unset `window.matchMedia` and set `navigator.maxTouchPoints`.
