---
id: TICKET-026
epic: EPIC-003
title: useContext / useProvideContext for shared state
status: done
priority: high
branch: ticket-026-use-context-shared-state
created: 2026-02-26
updated: 2026-02-26
---

## Description

Add a context system to `@pulse-ts/core` that allows ancestor nodes to provide values and descendant nodes to read them without prop drilling. Inspired by React's Context API.

API:
- `createContext<T>()` — returns a typed context key
- `useProvideContext(ctx, value)` — provides a value on the current node, available to all descendants
- `useContext(ctx)` — reads the nearest ancestor's provided value (throws if not found)

This eliminates the pattern of threading shared mutable objects (RespawnState, ShakeState, CollectibleState, player node ref) through every intermediate node's props.

## Acceptance Criteria

- [x] `createContext<T>()` returns a typed context key
- [x] `useProvideContext(ctx, value)` sets a value on the current node
- [x] `useContext(ctx)` reads the nearest ancestor's provided value
- [x] `useContext` throws a clear error if no provider is found
- [x] Full JSDoc with `@param`, `@returns`, `@example`
- [x] Colocated tests
- [x] Update platformer demo to use contexts (removes shared state from props)

## Notes

- **2026-02-26**: Ticket created. This is the highest-impact DX improvement — affects every node that currently receives shared state via props.
- **2026-02-26**: Starting implementation. Also adding `useOptionalContext()` variant that returns `undefined` instead of throwing.
- **2026-02-26**: Implementation complete. Created `context.ts` with 4 exports (createContext, useProvideContext, useContext, useOptionalContext). Added `useOptionalContext` with default value support. 14 context tests + 56 platformer tests all pass. Migrated all 8 platformer demo nodes to use contexts.
