---
id: TICKET-144
title: Split ReplayNode DOM overlay from playback logic
status: done
epic: EPIC-026
created: 2026-03-14
updated: 2026-03-14
branch: ticket-144-split-replay-node-dom-overlay
priority: medium
---

## Problem

`ReplayNode` mixes DOM overlay management with game logic:
- DOM: 6 elements (flash, top bar, bottom bar, label, self-KO text, style injection), letterbox visibility, transition flash animation, self-KO message picking, per-letter bobbing DOM manipulation
- Game logic: replay playback advancement, hit burst emission at collision moments, trail particle emission, particle time scaling

These are independent concerns that happen to be triggered by the same phase.

## Solution

Split the DOM overlay (letterbox + label + flash + self-KO text) into a `ReplayOverlayNode`. Keep the playback driver + VFX in `ReplayNode`. Both read the same game state but handle their respective concerns independently.

## Files

- `demos/arena/src/nodes/ReplayNode.ts`

- **2026-03-14**: Starting implementation
- **2026-03-14**: Implementation complete
