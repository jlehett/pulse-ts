---
id: TICKET-052
epic: EPIC-008
title: Visual polish
status: done
priority: low
created: 2026-02-26
updated: 2026-02-28
branch: ticket-052-visual-polish
labels:
  - arena
  - visual
  - polish
---

## Description

Visual polish pass: torus edge ring with animated emissive around the platform, fog tuning, shadow configuration, background color/atmosphere adjustments.

## Acceptance Criteria

- [x] Torus edge ring around platform with animated emissive via `useAnimate`
- [x] Fog tuned for arena atmosphere
- [x] Shadow configuration (renderer + directional light)
- [x] Background color and atmosphere finalized

## Notes

- **2026-02-26**: Ticket created.
- **2026-02-28**: Status changed to in-progress
- **2026-02-28**: Edge ring already existed (PlatformNode). Tuned fog (near: 20, far: 50, color: 0x0a0e1e), bumped shadow map to 2048, matched clear color to fog. 55 tests pass.
- **2026-02-28**: Status changed to done
