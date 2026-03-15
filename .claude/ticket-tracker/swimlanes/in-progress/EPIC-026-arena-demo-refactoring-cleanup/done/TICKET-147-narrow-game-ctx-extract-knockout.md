---
id: TICKET-147
title: Narrow GameCtx and extract knockout detection
status: in-progress
epic: EPIC-026
created: 2026-03-14
priority: low
---

## Problem

`GameState` has 13 fields with mixed concerns:
- **Knockout queue**: `pendingKnockout`, `pendingKnockout2` are a tiny queue used only between `LocalPlayerNode` and `GameManagerNode`
- **Static player config**: `playerLabels`, `playerColors`, `playerHexColors` are set once at creation and only used in solo mode
- **Core game state**: `scores`, `round`, `phase`, `lastKnockedOut`, `countdownValue`, `matchWinner`, `isTie`, `paused`

The context is wider than necessary, making it harder to understand what state is dynamic vs static.

## Solution

- Extract `pendingKnockout`/`pendingKnockout2` into a dedicated world-scoped store or channel
- Group `playerLabels`/`playerColors`/`playerHexColors` into a `playerConfig` sub-object or separate context since they're static after creation

## Files

- `demos/arena/src/contexts.ts`
- `demos/arena/src/nodes/ArenaNode.ts`
- `demos/arena/src/nodes/GameManagerNode.ts`
- `demos/arena/src/nodes/LocalPlayerNode.ts`
