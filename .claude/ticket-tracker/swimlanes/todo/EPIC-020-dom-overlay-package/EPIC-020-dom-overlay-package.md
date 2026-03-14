---
id: EPIC-020
title: DOM Overlay Package
status: todo
created: 2026-03-13
updated: 2026-03-13
---

## Description

Create a new `@pulse-ts/dom` package with a lightweight JSX runtime for game UI overlays.
Supports reactive bindings (function values dirty-checked each frame), built-in layout
primitives (Row, Column, Button, Overlay), and functional components with full pulse-ts
hook access. No virtual DOM, no diffing — JSX runs once at mount, reactive bindings
handle per-frame updates.

## Goal

Game UI (HUD, menus, overlays) can be built with expressive TSX syntax and reactive
bindings, eliminating manual DOM manipulation boilerplate while maintaining high
performance for real-time games.

## Notes

- **2026-03-13**: Epic created from approved engine improvement #1. Single large ticket. Subsumes #6 (useButton), #24 (useModal), #28 (useEntrance).
