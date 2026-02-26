---
id: TICKET-037
epic: EPIC-007
title: useWaypointPatrol kinematic patrol hook
status: done
priority: medium
created: 2026-02-26
updated: 2026-02-26
---

## Description

Add `useWaypointPatrol()` to `@pulse-ts/physics` for kinematic bodies that patrol between waypoints.

## Acceptance Criteria

- [x] `useWaypointPatrol(body, options)` sets kinematic body velocity to follow waypoints
- [x] `speed` mode: constant velocity, linear interpolation
- [x] `duration` mode: time-based with easing support
- [x] Built-in easing presets: linear, ease-in, ease-out, ease-in-out
- [x] Custom easing function: `easing: (t) => number`
- [x] Custom interpolation: `interpolate: (from, to, t) => [x, y, z]`
- [x] 2+ waypoints supported
- [x] `loop` option: true = restart at first waypoint, false/default = ping-pong
- [x] `pause()` / `resume()` control
- [x] Full JSDoc with `@param`, `@returns`, `@example`
- [x] Colocated tests
- [x] Update platformer demo MovingPlatformNode and EnemyNode to use hook

## Notes

- **2026-02-26**: Ticket created. Identical 20-line patrol logic is duplicated between MovingPlatformNode and EnemyNode.
- **2026-02-26**: Status changed to done
