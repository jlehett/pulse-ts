---
id: TICKET-065
title: Pause menu
status: done
priority: high
created: 2026-03-01
updated: 2026-03-01
labels:
  - arena
  - feature
branch: ticket-065-pause-menu
---

## Description

Add an Escape-key pause menu to the arena demo. A new `PauseMenuNode` renders a DOM overlay with
"PAUSED" title, Resume button (teal), and Exit Match button (coral) over a dark backdrop (z-index
4500). The pause toggle uses `gameState.paused` (a new boolean on `GameState`) rather than
`world.pause()` so the overlay's own `useFrameUpdate` continues running. Existing nodes
(`LocalPlayerNode`, `GameManagerNode`, `RemotePlayerNode`) check the flag to freeze their logic.
Player velocity is saved on pause entry and restored on unpause to prevent momentum-cancellation
cheating.

## Acceptance Criteria

- [x] Add `paused: boolean` to `GameState` interface
- [x] Add `pause: Key('Escape')` binding
- [x] Create `PauseMenuNode` with backdrop, title, Resume, and Exit Match buttons
- [x] Mount `PauseMenuNode` in `ArenaNode`
- [x] Freeze `LocalPlayerNode` when paused (save/restore velocity)
- [x] Skip `GameManagerNode` fixed update when paused
- [x] Skip `RemotePlayerNode` knockout detection when paused
- [x] Add `PauseMenuNode.test.ts`
- [x] All arena tests pass
- [x] Lint clean

## Notes

- **2026-03-01**: Implemented pause menu feature. All 82 arena tests pass, lint clean.
- **2026-03-01**: Fixed momentum-cancellation cheat — velocity is now saved/restored across pause.
