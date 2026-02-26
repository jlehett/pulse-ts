---
id: TICKET-026
epic: EPIC-003
title: useContext / useProvideContext for shared state
status: todo
priority: high
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

- [ ] `createContext<T>()` returns a typed context key
- [ ] `useProvideContext(ctx, value)` sets a value on the current node
- [ ] `useContext(ctx)` reads the nearest ancestor's provided value
- [ ] `useContext` throws a clear error if no provider is found
- [ ] Full JSDoc with `@param`, `@returns`, `@example`
- [ ] Colocated tests
- [ ] Update platformer demo to use contexts (removes shared state from props)

## Notes

- **2026-02-26**: Ticket created. This is the highest-impact DX improvement — affects every node that currently receives shared state via props.
