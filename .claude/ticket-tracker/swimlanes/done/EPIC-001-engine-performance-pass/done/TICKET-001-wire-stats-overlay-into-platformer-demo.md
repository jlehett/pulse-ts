---
id: TICKET-001
epic: EPIC-001
title: Wire stats overlay into platformer demo
status: todo
priority: high
created: 2026-02-24
updated: 2026-02-24
---

## Description

Enable the existing `StatsOverlaySystem` from `@pulse-ts/three` in the platformer demo so FPS and physics step rate are visible during manual testing. This is a prerequisite for visually verifying any performance improvements.

`StatsOverlaySystem` already exists at `packages/three/src/domain/systems/statsOverlay.ts` but is not installed in the platformer's `main.ts`. It updates every 300ms and displays FPS and fixed-step rate.

## Acceptance Criteria

- [ ] `StatsOverlaySystem` is installed in the platformer demo (`demos/platformer/src/main.ts`)
- [ ] FPS and SPS counters are visible on screen when running `npm run dev -w demos/platformer`
- [ ] Overlay does not noticeably impact frame time itself

## Notes

- **2026-02-24**: Ticket created. Blocks TICKET-007 (shadow map reduction — needs overlay to confirm improvement).
