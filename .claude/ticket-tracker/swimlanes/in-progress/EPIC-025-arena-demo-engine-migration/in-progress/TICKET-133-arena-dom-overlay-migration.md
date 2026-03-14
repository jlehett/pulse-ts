---
id: TICKET-133
epic: EPIC-025
title: "Arena migration: DOM overlays"
status: in-progress
priority: high
created: 2026-03-13
updated: 2026-03-14
labels:
  - arena
  - migration
  - dom
---

## Description

Refactor all arena demo overlay nodes to use `@pulse-ts/dom` TSX instead of manual
DOM manipulation. Replace `document.createElement`, inline style assignments, and
manual DOM cleanup with declarative TSX components and reactive bindings.

Also migrate `overlayAnimations.ts` patterns into the new DOM system.

## Affected Files

- `CountdownOverlayNode.ts` — countdown display with reactive text
- `DisconnectOverlayNode.ts` — disconnect warning overlay
- `IntroOverlayNode.ts` — intro sequence with animated elements
- `KnockoutOverlayNode.ts` — knockout notification
- `MatchOverOverlayNode.ts` — match end overlay with buttons
- `PauseMenuNode.ts` — pause menu with buttons
- `ScoreHudNode.ts` — score display with reactive updates
- `DashCooldownHudNode.ts` — cooldown progress indicator
- `overlayAnimations.ts` — shared animation utilities (may be simplified or removed)
- `menu.ts` — main menu DOM
- `lobby.ts` — lobby DOM

## Acceptance Criteria

- [ ] All overlay nodes use `useOverlay` with TSX
- [ ] Reactive bindings for dynamic content (scores, timers, visibility)
- [ ] Manual DOM creation/cleanup removed
- [ ] Built-in primitives (Row, Column, Button, Overlay) used where appropriate
- [ ] All tests pass (may need test updates for new DOM approach)
- [ ] Lint clean

## Notes

- **2026-03-13**: Ticket created. Depends on EPIC-020 completion. Largest migration ticket — 8+ overlay nodes plus menu/lobby.
