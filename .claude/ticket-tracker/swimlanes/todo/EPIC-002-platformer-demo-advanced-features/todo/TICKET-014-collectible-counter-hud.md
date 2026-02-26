---
id: TICKET-014
epic: EPIC-002
title: Collectible counter HUD
status: todo
priority: medium
created: 2026-02-25
updated: 2026-02-25
---

## Description

Display a live collectible counter on screen (e.g., "Gems: 3 / 5") so the player knows how many they've collected and how many remain.

- Implement as a DOM overlay (same approach as StatsOverlaySystem — a positioned `<div>` next to the canvas)
- Counter updates each time a collectible is picked up
- Should be readable but unobtrusive; position top-right to avoid clashing with the stats overlay (top-left)
- The total collectible count should come from the level definition so it stays in sync automatically

## Acceptance Criteria

- [ ] Counter visible on screen from game start
- [ ] Count increments correctly on each pickup
- [ ] Total reflects actual collectibles in the level
- [ ] Overlay is styled consistently with the stats overlay

## Notes

- **2026-02-25**: Ticket created. No blockers.
