---
id: TICKET-055
epic: EPIC-008
title: Single-canvas refactor and gameplay tuning
status: done
priority: high
branch: ticket-055-single-canvas-refactor-and-gameplay-tuning
created: 2026-03-01
updated: 2026-03-01
labels:
  - arena
  - refactor
  - gameplay
---

## Description

Replace split-screen (two worlds + network) with a single-canvas, single-world local 2-player setup, plus gameplay tuning for camera, movement, knockback, and arena sizing.

### Changes

1. **Single-canvas architecture** — removed split-screen layout, MemoryHub, `installNetwork`, `RemotePlayerNode` usage. Both players are `LocalPlayerNode` instances in one world. Replaced network channels with shared `GameState` mutations (`pendingKnockout`, round-number tracking). Namespaced input bindings (`p1Move`/`p2Move`, `p1Dash`/`p2Dash`). Neutral overlays ("P1/P2" instead of "You/Opponent").
2. **Fixed overhead camera** — replaced follow camera with a static camera centered on the arena. Eliminates rotation artifacts at steep angles.
3. **Momentum-based movement** — impulse per tick + linear damping instead of direct velocity setting. Icy, heavy feel with gradual acceleration and long coasting.
4. **Horizontal-only knockback** — removed upward impulse component that caused players to float when colliding repeatedly.
5. **Impact sound cooldown** — prevents sound spam during sustained contact.
6. **Arena and player sizing** — arena radius 10→14, player radius 0.5→0.8, spawn positions widened ±3→±5, camera height tuned. Platform uses shared `ARENA_RADIUS` config.

## Acceptance Criteria

- [x] Single canvas, single world, no network dependency for local play
- [x] Both players controllable via namespaced input bindings
- [x] Fixed overhead camera with no rotation artifacts
- [x] Momentum-based movement with icy feel
- [x] Horizontal-only knockback (no floating)
- [x] Impact sound cooldown
- [x] Arena enlarged, players enlarged, camera tuned
- [x] All 57 tests pass
- [x] Lint clean

## Notes

- **2026-03-01**: Ticket created. All work already complete.
