---
id: EPIC-007
title: Physics Utilities
status: in-progress
created: 2026-02-26
updated: 2026-02-26
---

## Description

Add utility functions and hooks to `@pulse-ts/physics` that were identified as reusable patterns in the platformer demo: kinematic surface velocity computation and waypoint patrol behavior.

## Goal

Extract `getKinematicSurfaceVelocity()` from demo code into the physics package, and provide `useWaypointPatrol()` with support for easing curves and custom interpolation to eliminate duplicated patrol logic.

## Notes

- **2026-02-26**: Epic created. `getKinematicSurfaceVelocityXZ` is currently stranded in PlayerNode.ts. Patrol logic is duplicated verbatim between MovingPlatformNode and EnemyNode.
- **2026-02-26**: Status changed to in-progress
