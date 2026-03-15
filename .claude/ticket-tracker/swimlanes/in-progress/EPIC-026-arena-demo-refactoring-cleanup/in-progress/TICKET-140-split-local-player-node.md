---
id: TICKET-140
title: Split LocalPlayerNode into focused concerns
status: in-progress
epic: EPIC-026
created: 2026-03-14
updated: 2026-03-14
branch: ticket-140-split-local-player-node
priority: high
---

## Problem

At 840 lines, `LocalPlayerNode` handles 8+ distinct concerns:
- Physics setup (rigidbody, collider)
- Mesh creation (sphere with emissive glow)
- Input reading (movement axis, dash action)
- Dash mechanics (timer, cooldown, direction computation)
- Knockback calculation and collision handling
- Online replication + knockback channel networking
- Replay staging and position broadcasting
- Death-plane detection and round reset
- Indicator ring DOM management (create, position, cleanup)
- Sound effects (dash, death, impact)
- Trail particle emission
- Cooldown HUD sync

## Solution

Extract into focused modules:
- **`indicatorRing.ts`** — indicator ring DOM creation, screen projection, cleanup
- **`knockback.ts`** — collision/knockback handler including online velocity correction
- **`dash.ts`** or `useDash` hook — dash timer, cooldown, direction computation
- **Mechanics utility file** — move exported pure functions (`computeKnockback`, `computeApproachSpeed`, `computeDashDirection`) out of the node

`LocalPlayerNode` becomes an orchestrator that composes these pieces.

## Files

- `demos/arena/src/nodes/LocalPlayerNode.ts`

- **2026-03-14**: Starting implementation
