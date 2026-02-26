---
id: TICKET-012
epic: EPIC-002
title: Goal object and win screen
status: done
priority: high
created: 2026-02-25
updated: 2026-02-26
---

## Description

Add a goal object (e.g., a glowing portal or star) at the end of the level. When the player touches it, display a win screen overlay and stop the game loop (or offer a restart).

- `GoalNode` — visual object with a trigger collider (sphere or box); emits a world event on player contact
- Win screen — a full-screen HTML overlay (similar approach to StatsOverlaySystem) that appears on win, showing "You Win!" and a restart button
- Restart should reload the page or remount the world

## Acceptance Criteria

- [x] A visually distinct goal object appears at the end of the level
- [x] Touching the goal triggers the win screen
- [x] Win screen is clearly readable and offers a way to restart
- [x] Win screen does not require a UI framework — plain DOM is fine

## Notes

- **2026-02-25**: Ticket created. No blockers.
- **2026-02-26**: Starting implementation — GoalNode FC, showWinScreen helper, level config, LevelNode wiring.
- **2026-02-26**: Complete. Created GoalNode with octahedron visual, spin/bob animation, trigger collider, and win screen overlay. All 11 tests pass.
