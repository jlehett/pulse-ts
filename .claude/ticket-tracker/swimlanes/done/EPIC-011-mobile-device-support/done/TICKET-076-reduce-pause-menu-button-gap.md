---
id: TICKET-076
epic: EPIC-011
title: Reduce gap between pause menu buttons
status: done
branch: ticket-074-075-076-pause-menu-ui-fixes
priority: low
created: 2026-03-02
updated: 2026-03-02
labels:
  - ui
  - arena
---

## Description

In PauseMenuNode, the Resume button is positioned at `top: 50%` and Exit Match at
`top: 60%`, creating a large visual gap between them — especially on non-mobile screens
where 10% of the viewport is a significant distance. This gap is much larger than the
spacing between the Local Play / Online Play buttons in menu.ts.

Reduce the gap to match the menu.ts button spacing. Consider switching from absolute
percentage positioning to a flex column layout with a controlled `gap` value, consistent
with how menu.ts and lobby.ts handle button groups.

## Acceptance Criteria

- [x] Gap between Resume and Exit Match buttons is visually consistent with menu.ts button spacing
- [x] Layout looks correct on both mobile and desktop screen sizes
- [x] Title ("PAUSED" / "MENU") spacing to buttons is visually balanced

## Notes

- **2026-03-02**: Ticket created.
- **2026-03-02**: Refactored PauseMenuNode from absolute `top: 50%`/`60%` positioning to flex column layout with `gap: '12px'`, matching menu.ts button spacing.
