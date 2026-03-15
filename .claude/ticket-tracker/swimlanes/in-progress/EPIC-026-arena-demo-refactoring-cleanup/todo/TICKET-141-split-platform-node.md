---
id: TICKET-141
title: Split PlatformNode into focused concerns
status: todo
epic: EPIC-026
created: 2026-03-14
priority: high
---

## Problem

At 825 lines, `PlatformNode` combines:
- Physics setup (static rigidbody, cylinder collider)
- 5 procedural texture generators (`createGridNormalMap`, `createGridEmissiveMap`, `createEnergyLineMap`, `createRingGlowMap`, `createWakeMap`)
- 4 mesh creations (platform cylinder, blue tint fill, energy line overlay, ring + outer glow)
- Complex shader patching (ripple + wake + hit ripple via `onBeforeCompile`)
- CPU-based wake rasterization (`rasterizeWake`, `WakeTrailPoint`, trail tracking)
- Scene traversal for player positions
- Frame update animation logic (pulsing, spinning, ripple timing)

## Solution

Extract into focused modules:
- **`platform/textures.ts`** — 5 texture generator functions
- **`platform/wake.ts`** — wake trail tracking, `rasterizeWake`, `WakeTrailPoint` interface
- **`platform/shaderPatch.ts`** — ripple/wake/hit-ripple shader patching logic

`PlatformNode` becomes a concise orchestrator that composes these pieces.

## Files

- `demos/arena/src/nodes/PlatformNode.ts`
