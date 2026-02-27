---
id: TICKET-042
epic: EPIC-008
title: Local player — movement and dash
status: todo
priority: high
created: 2026-02-26
updated: 2026-02-26
labels:
  - arena
  - player
  - physics
  - input
---

## Description

`LocalPlayerNode` — dynamic sphere rigid body with WASD/arrow movement and a dash mechanic (cooldown + timer). `PlayerTag` component for collision identification. No network wiring yet — each canvas shows only its own local player. Colocated test for constants and a pure `computeDashDirection` function.

## Acceptance Criteria

- [ ] `LocalPlayerNode` creates a dynamic sphere rigid body
- [ ] Movement driven by `useAxis2D` from per-world bindings
- [ ] Dash mechanic with cooldown (`useCooldown`) and timer (`useTimer`)
- [ ] `PlayerTag` component attached for collision identification
- [ ] `computeDashDirection` exported as a pure function
- [ ] Colocated test for constants and `computeDashDirection`
- [ ] Both canvases show one ball each (no network yet)

## Notes

- **2026-02-26**: Ticket created.
