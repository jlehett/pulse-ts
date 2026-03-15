---
id: TICKET-151
title: Consolidate menu button hover logic
status: in-progress
epic: EPIC-026
created: 2026-03-14
updated: 2026-03-14
branch: ticket-151-consolidate-menu-button-hover
priority: low
---

## Problem

`menu.tsx:98-147` `createMenuButton` manually adds 4 pointer event handlers (`pointerenter`, `pointerdown`, `pointerup`, `pointerleave`) to manage hover/press visual effects (border color, box shadow, background gradient changes). This duplicates work that `@pulse-ts/dom`'s `Button` component and `applyButtonHoverScale` already partially handle.

The lobby also has its own button creation (`createBtn`) that uses `Button` + `applyButtonHoverScale` without the manual pointer events.

## Solution

Consolidate button styling into the `Button` component's accent behavior or a shared utility function. The menu should use the same button creation pattern as the lobby, potentially with an additional style variant for the gradient background.

## Files

- `demos/arena/src/menu.tsx`
- `demos/arena/src/overlayAnimations.ts`

## Notes

- **2026-03-14**: Starting implementation
