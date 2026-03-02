---
id: TICKET-075
epic: EPIC-011
title: Match pause menu button widths (Resume / Exit Match)
status: todo
priority: low
created: 2026-03-02
updated: 2026-03-02
labels:
  - ui
  - arena
---

## Description

In PauseMenuNode, the "Resume" and "Exit Match" buttons have different widths because they
use different text lengths and no shared minimum width. They should have the same width for
visual consistency.

Add a shared `minWidth` to both buttons or use a flex container approach to equalize their
widths on both mobile and non-mobile devices.

## Acceptance Criteria

- [ ] Resume and Exit Match buttons have the same visible width
- [ ] Consistent on both mobile and desktop screen sizes
- [ ] No layout overflow on narrow screens

## Notes

- **2026-03-02**: Ticket created.
