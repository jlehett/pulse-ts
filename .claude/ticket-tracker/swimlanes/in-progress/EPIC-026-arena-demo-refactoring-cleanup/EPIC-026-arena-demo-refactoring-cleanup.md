---
id: EPIC-026
title: Arena Demo Refactoring & Cleanup
status: in-progress
created: 2026-03-14
updated: 2026-03-14
---

Comprehensive refactoring of the arena demo to reduce duplication, split oversized files into focused concerns, eliminate module-level mutable state, and reorganize the directory structure into semantic groups.

## Goals

- Eliminate duplicated world setup, trail particle, collision VFX, and config code
- Split the 4 largest files (LocalPlayerNode 840 LOC, PlatformNode 825 LOC, lobby.tsx 1058 LOC, ReplayNode) into focused modules
- Move module-level mutable state (camera shake, player positions) to world-scoped stores
- Simplify replay system by removing redundant accessors and using array-based frame storage
- Reorganize flat `nodes/` (27 files) and cluttered `src/` root (14 loose files) into semantic directory groups

## Tickets

- TICKET-136: Extract shared world setup factory in main.ts
- TICKET-137: Extract shared trail particle emission logic
- TICKET-138: Extract shared collision VFX trigger
- TICKET-139: Centralize particle burst and sound configs
- TICKET-140: Split LocalPlayerNode into focused concerns
- TICKET-141: Split PlatformNode into focused concerns
- TICKET-142: Move camera shake state to world-scoped store
- TICKET-143: Move player positions to world-scoped store
- TICKET-144: Split ReplayNode DOM overlay from playback logic
- TICKET-145: Split lobby.tsx into focused modules
- TICKET-146: Remove redundant replay accessor functions
- TICKET-147: Narrow GameCtx and extract knockout detection
- TICKET-148: Create generic shared effect pool factory
- TICKET-149: Use arrays instead of named fields in replay frames
- TICKET-150: Replace scene traversal with store reads for player positions
- TICKET-151: Consolidate menu button hover logic
- TICKET-152: Reorganize src/ directory structure

## Notes

- **2026-03-14**: Epic implementation started via agent team
