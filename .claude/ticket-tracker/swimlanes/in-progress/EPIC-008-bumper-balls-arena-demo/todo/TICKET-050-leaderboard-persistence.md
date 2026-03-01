---
id: TICKET-050
epic: EPIC-008
title: Leaderboard persistence
status: todo
priority: low
created: 2026-02-26
updated: 2026-02-28
labels:
  - arena
  - save
  - persistence
---

## Description

`leaderboard.ts` — pure localStorage utility for persisting match results. `GameManagerNode` saves on match end. `ScoreHudNode` shows all-time win record. Call `installSave` in main.ts. Full unit tests for leaderboard utility.

## Acceptance Criteria

- [x] `leaderboard.ts` utility with read/write functions for localStorage
- [ ] `GameManagerNode` saves match result on match end
- [ ] `ScoreHudNode` displays all-time win record
- [ ] `installSave` called in main.ts
- [x] Full unit tests for leaderboard utility (`leaderboard.test.ts`)

## Notes

- **2026-02-26**: Ticket created.
- **2026-02-28**: Status changed to in-progress
- **2026-02-28**: Implemented leaderboard utility, GameManagerNode save, ScoreHudNode all-time display, installSave wiring. 55 tests pass.
- **2026-02-28**: Status changed to done
- **2026-02-28**: Reopened. TICKET-053 (split-screen canvas fix) removed the leaderboard integrations as part of cleanup: `saveMatchResult()` call removed from GameManagerNode, all-time display removed from ScoreHudNode, `installSave` removed from main.ts. The utility code (`leaderboard.ts`, `leaderboard.test.ts`) still exists and passes tests but is orphaned. To resolve: re-integrate `saveMatchResult()` into GameManagerNode at match end, restore the all-time win record display in ScoreHudNode, and re-add `installSave(world)` to main.ts.
