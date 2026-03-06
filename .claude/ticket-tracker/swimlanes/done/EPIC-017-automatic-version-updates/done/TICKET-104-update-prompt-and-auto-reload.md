---
id: TICKET-104
epic: EPIC-017
title: Update prompt and auto-reload between matches
status: done
branch: ticket-104/update-prompt-auto-reload
pr: 106
priority: high
created: 2026-03-05
updated: 2026-03-05
labels:
  - ui
  - arena
---

## Description

When the version poller (TICKET-103) detects a new deployment, prompt the user
and reload at an appropriate time so active gameplay is never interrupted.

### Behavior

- **During a match:** Do nothing. Defer the update until the match ends.
- **Between matches (match-over screen, menu, lobby):** Show a brief banner
  ("New version available — updating...") and reload the page after a short
  delay (~2s).
- **Idle on menu:** Same as above — show banner, then reload.
- **Edge case:** If the user starts a new match before the reload fires, cancel
  the reload and defer again until the next match end.

### Files to touch

- `demos/arena/src/nodes/MatchOverOverlayNode.ts` or menu — trigger reload
- `demos/arena/src/versionCheck.ts` — expose hook/callback for UI integration
- Possibly a small overlay/banner component for the update notification

## Acceptance Criteria

- [x] No reload or interruption during active gameplay
- [x] Banner appears between matches when an update is available
- [x] Page reloads automatically after banner is shown
- [x] If a new match starts before reload, update is deferred
- [x] Banner is visually clear but unobtrusive

## Notes

- **2026-03-05**: Ticket created.
