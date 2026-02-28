---
id: TICKET-042
epic: EPIC-008
title: Local player — movement and dash
status: done
priority: high
branch: ticket-042-local-player-movement-and-dash
created: 2026-02-26
updated: 2026-02-28
labels:
  - arena
  - player
  - physics
  - input
---

## Description

`LocalPlayerNode` — dynamic sphere rigid body with WASD/arrow movement and a dash mechanic (cooldown + timer). `PlayerTag` component for collision identification. No network wiring yet — each canvas shows only its own local player. Colocated test for constants and a pure `computeDashDirection` function.

## Acceptance Criteria

- [x] `LocalPlayerNode` creates a dynamic sphere rigid body
- [x] Movement driven by `useAxis2D` from per-world bindings
- [x] Dash mechanic with cooldown (`useCooldown`) and timer (`useTimer`)
- [x] `PlayerTag` component attached for collision identification
- [x] `computeDashDirection` exported as a pure function
- [x] Colocated test for constants and `computeDashDirection`
- [x] Both canvases show one ball each (no network yet)

## Notes

- **2026-02-26**: Ticket created.
- **2026-02-28**: Starting implementation.
- **2026-02-28**: Complete. Dynamic sphere (r=0.5) with WASD/arrow movement (12 u/s), dash (30 u/s, 0.15s duration, 1s cooldown), PlayerTag, death plane respawn. 11 new tests for computeDashDirection + constants.
