---
id: TICKET-063
title: Remove leaderboard system
status: done
priority: medium
epic: EPIC-010
branch: ticket-063-remove-leaderboard
created: 2026-03-01
updated: 2026-03-01
---

# TICKET-063: Remove leaderboard system

The leaderboard feature doesn't make sense for the arena demo. Remove it entirely — delete leaderboard.ts, remove saveMatchResult from GameManagerNode, remove loadLeaderboard from ScoreHudNode, remove installSave from main.ts, and clean up the @pulse-ts/save dependency.

## Acceptance Criteria

- [x] leaderboard.ts and leaderboard.test.ts deleted
- [x] saveMatchResult() call removed from GameManagerNode
- [x] loadLeaderboard() display removed from ScoreHudNode
- [x] installSave() removed from main.ts
- [x] @pulse-ts/save dependency removed from package.json
- [x] All tests still pass

## Notes

- **2026-03-01**: Implementation complete. Removed all leaderboard code, installSave, and @pulse-ts/save dependency. 65 tests pass.
