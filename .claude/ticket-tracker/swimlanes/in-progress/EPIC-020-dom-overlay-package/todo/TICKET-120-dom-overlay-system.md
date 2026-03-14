---
id: TICKET-120
epic: EPIC-020
title: DOM Overlay System (@pulse-ts/dom)
status: todo
priority: high
created: 2026-03-13
updated: 2026-03-13
labels:
  - dom
  - new-package
---

## Description

Create a new `@pulse-ts/dom` package with a lightweight JSX runtime for game UI overlays.
No virtual DOM, no diffing — JSX runs once at mount. Reactive bindings (function values
in props) are dirty-checked each frame for automatic DOM updates.

Includes:
- Lightweight JSX runtime (`jsx`, `jsxs`, `Fragment`)
- `useOverlay` hook for mounting JSX into the DOM
- Built-in primitives as functional components: `Row`, `Column`, `Button`, `Overlay`
- Full pulse-ts hook access in functional components
- TSX support via tsconfig.json `jsxImportSource` (no per-file pragma)

Design doc: `design-docs/approved/001-dom-overlay-system.md`

## Acceptance Criteria

- [ ] New `@pulse-ts/dom` package created
- [ ] JSX runtime: `jsx`, `jsxs`, `Fragment` exports
- [ ] `useOverlay(jsxElement)` mounts JSX tree and manages lifecycle
- [ ] Reactive bindings: function values in props/style dirty-checked each frame
- [ ] Built-in primitives: Row, Column, Button, Overlay as functional components
- [ ] Functional components support full pulse-ts hooks (useFixedUpdate, useWatch, etc.)
- [ ] TSX via tsconfig `jsxImportSource` — no per-file pragma needed
- [ ] Elements cleaned up on node destroy
- [ ] JSDoc with examples on all public APIs
- [ ] Unit tests for JSX runtime, reactive bindings, lifecycle
- [ ] Documentation: overview, quickstart, examples

## Notes

- **2026-03-13**: Ticket created from approved design doc #1. Subsumes improvements #6 (useButton), #24 (useModal), #28 (useEntrance).
