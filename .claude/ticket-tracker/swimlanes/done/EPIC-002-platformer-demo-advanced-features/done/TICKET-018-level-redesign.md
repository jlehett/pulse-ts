---
id: TICKET-018
epic: EPIC-002
title: Level redesign with 2–3 distinct stages
status: done
priority: medium
branch: ticket-018-level-redesign-3-distinct-stages
created: 2026-02-25
updated: 2026-02-26
---

## Description

Redesign the level to incorporate all the new systems and feel like a proper game. Replace the single linear arrangement of 8 static platforms with a 2–3 stage layout that teaches and exercises every mechanic.

Suggested stage structure:
- **Stage 1 — Tutorial**: Static platforms, 2–3 collectibles, teaches basic movement and jump
- **Stage 2 — Intermediate**: Moving platforms, rotating platform, hazards, 2 collectibles, introduces coyote time and variable jump
- **Stage 3 — Advanced**: Enemy patrol, faster moving platforms, dash-required gap, 2 collectibles, goal object at the end

Update `level.ts` to hold all platform/hazard/enemy/collectible/goal definitions for the new layout. Adjust fog and shadow frustum if the level footprint changes significantly.

## Acceptance Criteria

- [x] Level has at least 2 distinct stages with increasing difficulty
- [x] All new node types (moving platform, rotating platform, hazard, enemy, goal) appear at least once
- [x] Collectibles are distributed across stages (total ≥ 7)
- [x] Goal object is reachable but requires using all major mechanics
- [x] Shadow frustum and fog remain correctly fitted to the new layout

## Notes

- **2026-02-25**: Ticket created. Blocked by TICKET-011 (moving/rotating platforms). Best done after most other feature tickets are complete.
- **2026-02-26**: Starting implementation — 3-stage level redesign.
- **2026-02-26**: Done. 3-stage layout with 15 static platforms, 4 moving, 1 rotating, 4 hazards, 3 enemies, 8 collectibles, 2 checkpoints, 1 goal. Shadow/fog/light updated for X: 0–67. All 21 tests pass.
