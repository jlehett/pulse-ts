---
id: TICKET-040
epic: EPIC-008
title: Project scaffold
status: todo
priority: high
created: 2026-02-26
updated: 2026-02-26
labels:
  - arena
  - scaffold
---

## Description

Create the `demos/arena/` project with all build/test configuration and a minimal runnable entry point. Two-canvas split-screen layout in HTML, two World instances connected via MemoryHub, config files for arena constants and input bindings, context definitions, and a minimal ArenaNode with lighting.

## Acceptance Criteria

- [ ] `demos/arena/package.json` with dependencies on all engine packages (core, input, physics, three, effects, audio, network, save)
- [ ] `demos/arena/vite.config.ts` with path aliases for all packages
- [ ] `demos/arena/tsconfig.json` matching platformer config
- [ ] `demos/arena/jest.config.mjs` matching platformer config
- [ ] `demos/arena/index.html` with two side-by-side canvases
- [ ] `demos/arena/src/main.ts` creating two World instances with MemoryHub
- [ ] `demos/arena/src/config/arena.ts` with ARENA_RADIUS, DEATH_PLANE_Y, SPAWN_POSITIONS, WIN_COUNT
- [ ] `demos/arena/src/config/bindings.ts` with P1 (WASD+Space+ShiftLeft) and P2 (Arrows+Enter+ShiftRight) binding sets
- [ ] `demos/arena/src/config/channels.ts` with defineChannel exports
- [ ] `demos/arena/src/contexts.ts` with GameCtx, PlayerIdCtx, LocalPlayerNodeCtx
- [ ] `demos/arena/src/nodes/ArenaNode.ts` with lighting setup
- [ ] `"demo:arena"` script added to root package.json
- [ ] `npm run dev -w demos/arena` serves without errors

## Notes

- **2026-02-26**: Ticket created.
