---
id: TICKET-136
title: Extract shared world setup factory in main.ts
status: todo
epic: EPIC-026
created: 2026-03-14
priority: high
---

## Problem

`createMenuWorld()`, `startLocalGame()`, `startSoloGame()`, and `startOnlineGame()` in `main.ts` all repeat nearly identical world creation boilerplate (~30 lines each):
- `new World()`
- `installDefaults(world)`
- `installPhysics(world, { gravity: { x: 0, y: -20, z: 0 } })`
- `installThree(world, { canvas, clearColor: 0x050508 })`
- Mobile pixel ratio cap (`Math.min(devicePixelRatio, 2)`)
- Shadow map setup (desktop only)
- `setupPostProcessing(three)`

## Solution

Extract a `createGameWorld(options)` factory that handles the shared setup and returns `{ world, three, shockwavePass, cleanup }`. Each game mode function becomes a thin wrapper that adds mode-specific extras (audio, input, network) and mounts `ArenaNode` with the appropriate props.

## Files

- `demos/arena/src/main.ts`
