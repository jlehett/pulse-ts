---
id: TICKET-153
title: Project scaffold & basic game loop
status: done
priority: high
created: 2026-05-16
updated: 2026-05-16
labels:
  - lumenwake
  - setup
branch: ticket-153-project-scaffold-and-basic-game-loop
---

## Description

Set up the Lumenwake demo project with Vite, TypeScript, and all required @pulse-ts dependencies. Create the foundational game loop and flow skeleton.

## Acceptance Criteria

- [x] `demos/lumenwake/` directory with Vite + TypeScript config
- [x] `package.json` with dependencies: @pulse-ts/core, three, physics, input, audio, effects, network, dom
- [x] `main.ts` entry point with world creation (installDefaults, installThree, installPhysics, installInput, installAudio, installEffects)
- [x] Top-down orthographic camera setup
- [x] Basic game flow skeleton (menu → lobby → game → summary)
- [x] Builds and renders an empty scene with dark background
- [x] Dev server runs without errors

## Notes

- 2026-05-16: Created. Foundation ticket — all other tickets depend on this.
- 2026-05-16: Complete. Scaffold builds cleanly, dev server starts, menu UI renders with solo/online buttons.
