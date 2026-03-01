---
id: TICKET-053
epic: EPIC-008
title: Fix split-screen canvas sizing
status: done
priority: high
created: 2026-02-28
updated: 2026-02-28
labels:
  - bug
  - arena
branch: ticket-053-fix-split-screen-canvas-sizing
---

## Description

The arena demo's split-screen layout was broken — the arena platform rendered off-screen in the bottom-right corner, making the game unplayable. The root cause was a CSS flexbox interaction with Three.js canvas sizing: canvas elements were missing `min-width: 0`, so when `renderer.setSize()` inflated the canvas `width` attribute, the intrinsic size prevented flexbox from shrinking the canvases to 50% viewport width. Each canvas reported `clientWidth: 2444` instead of the expected `~625`, giving the camera a 2:1 aspect ratio instead of ~0.5:1.

Additionally, `main.ts` had been left in a debug state with `world2.start()` commented out, extensive `console.log` statements, and a `setInterval` renderer dump.

## Acceptance Criteria

- [x] Add `min-width: 0` to split-screen canvas CSS
- [x] Canvas elements correctly size to 50% viewport width
- [x] Arena platform renders centered in each player's view
- [x] Both worlds start and render correctly in split-screen
- [x] Remove debug logging and commented-out code from main.ts

## Notes

- **2026-02-28**: Root cause identified — flexbox `min-width: auto` default prevents canvas from shrinking below intrinsic size set by Three.js `renderer.setSize()`. Fixed with `min-width: 0`. Cleaned up debug code in main.ts.
