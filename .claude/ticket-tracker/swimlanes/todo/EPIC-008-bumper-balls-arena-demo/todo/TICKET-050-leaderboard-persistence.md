---
id: TICKET-050
epic: EPIC-008
title: Leaderboard persistence
status: todo
priority: low
created: 2026-02-26
updated: 2026-02-26
labels:
  - arena
  - save
  - persistence
---

## Description

`leaderboard.ts` — pure localStorage utility for persisting match results. `GameManagerNode` saves on match end. `ScoreHudNode` shows all-time win record. Call `installSave` in main.ts. Full unit tests for leaderboard utility.

## Acceptance Criteria

- [ ] `leaderboard.ts` utility with read/write functions for localStorage
- [ ] `GameManagerNode` saves match result on match end
- [ ] `ScoreHudNode` displays all-time win record
- [ ] `installSave` called in main.ts
- [ ] Full unit tests for leaderboard utility (`leaderboard.test.ts`)

## Notes

- **2026-02-26**: Ticket created.
