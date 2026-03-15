---
id: TICKET-139
title: Centralize particle burst and sound configs
status: in-progress
epic: EPIC-026
created: 2026-03-14
priority: medium
---

## Problem

Particle burst configs are duplicated across multiple files:
- Trail burst (`count: 8, lifetime: 1.0, speed: [0.2, 0.8], gravity: 1, size: 0.4, blending: 'additive', shrink: true`) — in `LocalPlayerNode`, `RemotePlayerNode`, `ReplayNode`
- Impact burst (`count: 16, lifetime: 0.4, speed: [1, 3], gravity: 6, size: 0.3, blending: 'additive'`) — in `LocalPlayerNode`, `ReplayNode`
- Impact sound (`wave: 'square', frequency: [300, 100], duration: 0.1, gain: 0.15`) — in `LocalPlayerNode`, `ReplayNode`

## Solution

Create `config/particles.ts` and `config/sounds.ts` with shared config objects. Each consumer imports and spreads/uses the config instead of inline-defining it.

## Files

- `demos/arena/src/config/particles.ts` (new)
- `demos/arena/src/config/sounds.ts` (new)
- `demos/arena/src/nodes/LocalPlayerNode.ts`
- `demos/arena/src/nodes/RemotePlayerNode.ts`
- `demos/arena/src/nodes/ReplayNode.ts`
