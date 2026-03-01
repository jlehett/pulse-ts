---
id: TICKET-066
title: World.destroy() cleanup
status: done
priority: high
created: 2026-03-01
updated: 2026-03-01
labels:
  - core
  - bugfix
branch: ticket-065-pause-menu
---

## Description

After exiting a match via the pause menu's Exit Match button, the arena demo's lobby UI became
non-interactive — input boxes were not clickable. Root cause: `world.stop()` + `world.clearScene()`
did not detach services or systems, leaving the input system's pointer event listeners (registered
with `preventDefault: true`) active on `window`. The Three.js canvas also retained the last rendered
frame, making the arena visible behind the lobby.

Fix: added `World.destroy()` to `@pulse-ts/core` that stops the loop, clears the scene, destroys
the internal system node, and detaches all services and systems. Added `values()` and `clear()` to
`ServiceRegistry` and `SystemRegistry` to support iteration. Updated `main.ts` to call
`three.renderer.clear()` and `world.destroy()` on match exit.

## Acceptance Criteria

- [x] Add `values()` and `clear()` to `ServiceRegistry` and `SystemRegistry`
- [x] Add `World.destroy()` method
- [x] Update `main.ts` to use `world.destroy()` instead of `stop()` + `clearScene()`
- [x] Clear the canvas on match exit so arena is not visible behind lobby
- [x] Add test for `World.destroy()` in `world.test.ts`
- [x] Core and arena lint clean

## Notes

- **2026-03-01**: Implemented and verified. Input listeners properly removed, canvas cleared on exit.
