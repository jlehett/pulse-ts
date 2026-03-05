---
id: TICKET-096
epic: EPIC-015
title: Username system
status: in-progress
priority: medium
created: 2026-03-04
updated: 2026-03-04
branch: ticket-096-username-system
labels:
  - ui
  - arena
---

## Description

When a user selects Online Play, prompt them for a username if one is not
already saved. The username is persisted to localStorage and sent to the
signaling server for lobby identification. Provide a way for the user to
change their name.

## Acceptance Criteria

- [ ] Username prompt shown on first Online Play entry (no saved name)
- [ ] Username saved to localStorage and loaded on subsequent visits
- [ ] Username displayed in the lobby UI (host side and browse/join side)
- [ ] User can change their name (settings button or edit option in online menu)
- [ ] Username validated (non-empty, reasonable length limit)
- [ ] All tests pass

## Notes

- **2026-03-04**: Ticket created.
- **2026-03-04**: Starting implementation.
