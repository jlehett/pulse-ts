---
id: TICKET-079
epic: EPIC-012
title: Menu and overlay entrance animations
status: done
branch: ticket-079-menu-and-overlay-entrance-animations
priority: medium
created: 2026-03-02
updated: 2026-03-02
labels:
  - ui
  - arena
---

## Description

Make menus and overlays feel polished instead of placeholder-ish by adding staggered
entrance animations, scale effects, and hover feedback. No dependencies on other
tickets — this is pure DOM/CSS work.

### Shared utility (`overlayAnimations.ts`)
- `applyEntrance(el, delay)` — translateY(20px) + opacity fade-in with ease-out-expo
- `applyStaggeredEntrance(elements[], baseDelay)` — stagger 80ms between elements
- `applyScalePop(el)` — scale 1.5→1.0 over 250ms (for countdown numbers)
- `applyButtonHoverScale(btn)` — scale(1.05) on pointerenter

### Per-file changes (8 overlay files)
- menu.ts: staggered entrance for title, subtitle, button row
- lobby.ts: staggered entrance on each screen transition
- CountdownOverlayNode: scale pop per number change
- ScoreHudNode: player-colored text (teal/coral), scale pop on score change
- MatchOverOverlayNode: staggered entrance for result + button
- PauseMenuNode: staggered entrance for title + buttons
- KnockoutOverlayNode: scale pop on KO text
- DisconnectOverlayNode: staggered entrance for text + button
- All buttons: hover scale effect

## Acceptance Criteria

- [x] Menu elements stagger in (title → subtitle → buttons) with smooth animations
- [x] Countdown numbers pop-scale on each change
- [x] Score HUD shows player colors and flashes on score change
- [x] All overlay entrances feel smooth and professional
- [x] Button hover scale effect on all interactive buttons
- [x] All tests pass

## Notes

- **2026-03-02**: Ticket created.
- **2026-03-02**: Starting implementation.
- **2026-03-02**: Done. Created `overlayAnimations.ts` utility (4 helpers). Applied staggered entrances to menu, lobby (4 screens), match over, pause, disconnect. Scale pop on countdown numbers and KO text. Player-colored score HUD with pop on change. Hover scale on all buttons.
