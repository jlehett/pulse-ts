---
id: TICKET-040
epic: EPIC-008
title: Project scaffold
status: done
priority: high
branch: ticket-040-project-scaffold
created: 2026-02-26
updated: 2026-02-28
labels:
  - arena
  - scaffold
---

## Description

Create the `demos/arena/` project with all build/test configuration and a minimal runnable entry point. Two-canvas split-screen layout in HTML, two World instances connected via MemoryHub, config files for arena constants and input bindings, context definitions, and a minimal ArenaNode with lighting.

## Acceptance Criteria

- [x] `demos/arena/package.json` with dependencies on all engine packages (core, input, physics, three, effects, audio, network, save)
- [x] `demos/arena/vite.config.ts` with path aliases for all packages
- [x] `demos/arena/tsconfig.json` matching platformer config
- [x] `demos/arena/jest.config.mjs` matching platformer config
- [x] `demos/arena/index.html` with two side-by-side canvases
- [x] `demos/arena/src/main.ts` creating two World instances with MemoryHub
- [x] `demos/arena/src/config/arena.ts` with ARENA_RADIUS, DEATH_PLANE_Y, SPAWN_POSITIONS, WIN_COUNT
- [x] `demos/arena/src/config/bindings.ts` with P1 (WASD+Space+ShiftLeft) and P2 (Arrows+Enter+ShiftRight) binding sets
- [x] `demos/arena/src/config/channels.ts` with defineChannel exports
- [x] `demos/arena/src/contexts.ts` with GameCtx, PlayerIdCtx, LocalPlayerNodeCtx
- [x] `demos/arena/src/nodes/ArenaNode.ts` with lighting setup
- [x] `"demo:arena"` script added to root package.json
- [x] `npm run dev -w demos/arena` serves without errors

## Notes

- **2026-02-26**: Ticket created.
- **2026-02-28**: Starting implementation.
- **2026-02-28**: All acceptance criteria complete. Scaffold with split-screen HTML, two Worlds sharing a MemoryHub, config files, contexts, and ArenaNode with lighting. TypeScript and Vite build both pass.
