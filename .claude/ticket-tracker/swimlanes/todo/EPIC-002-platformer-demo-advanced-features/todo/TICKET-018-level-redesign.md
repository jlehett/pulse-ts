---
id: TICKET-018
epic: EPIC-002
title: Level redesign with 2–3 distinct stages
status: todo
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

- [ ] Level has at least 2 distinct stages with increasing difficulty
- [ ] All new node types (moving platform, rotating platform, hazard, enemy, goal) appear at least once
- [ ] Collectibles are distributed across stages (total ≥ 7)
- [ ] Goal object is reachable but requires using all major mechanics
- [ ] Shadow frustum and fog remain correctly fitted to the new layout

## Notes

- **2026-02-25**: Ticket created. Blocked by TICKET-011 (moving/rotating platforms). Best done after most other feature tickets are complete.
