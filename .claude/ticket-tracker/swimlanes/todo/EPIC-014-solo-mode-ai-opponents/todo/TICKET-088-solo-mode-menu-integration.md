---
id: TICKET-088
epic: EPIC-014
title: Solo mode menu integration
status: todo
priority: medium
created: 2026-03-02
updated: 2026-03-02
labels:
  - ui
  - arena
  - mobile
---

## Description

Add a "Solo" option to the main menu that launches a game against an AI opponent.
On mobile devices, remove the "Local" multiplayer option (it doesn't make sense
on a single touchscreen) and offer Solo instead. On desktop, both Local and Solo
should be available.

## Acceptance Criteria

- [ ] "Solo" option available in the main menu on both desktop and mobile
- [ ] "Local" option hidden on mobile devices
- [ ] Solo mode launches a game with an AI opponent
- [ ] Player can return to menu after a solo match
- [ ] All tests pass

## Notes

- **2026-03-02**: Ticket created.
- Depends on TICKET-087 (AI opponent system).
