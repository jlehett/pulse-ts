---
id: EPIC-003
title: Core DX Pass
status: done
created: 2026-02-26
updated: 2026-02-26
---

## Description

Improve developer experience in `@pulse-ts/core` by adding shared state management (context system) and declarative timer utilities. These are foundational improvements that reduce boilerplate across all game types.

## Goal

Eliminate prop drilling for shared state via `useContext()` / `useProvideContext()`, and replace manual timer bookkeeping with declarative `useTimer()` / `useCooldown()` hooks.

## Notes

- **2026-02-26**: Epic created. Identified from platformer demo analysis — shared mutable state objects (RespawnState, ShakeState, CollectibleState) are threaded through props manually, and 5+ timers are managed with raw `Math.max(0, timer - dt)` patterns.
- **2026-02-26**: Epic complete. Both tickets (TICKET-026 useContext, TICKET-027 useTimer/useCooldown) merged.
