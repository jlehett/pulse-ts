---
id: TICKET-037
epic: EPIC-007
title: useWaypointPatrol kinematic patrol hook
status: todo
priority: medium
created: 2026-02-26
updated: 2026-02-26
---

## Description

Add `useWaypointPatrol()` to `@pulse-ts/physics` for kinematic bodies that patrol between waypoints.

API:
```ts
const patrol = useWaypointPatrol(body, {
    waypoints: [pointA, pointB],
    speed: 2,              // constant velocity (linear only)
});

// Or time-based with easing:
const patrol = useWaypointPatrol(body, {
    waypoints: [pointA, pointB, pointC],
    duration: 3,           // seconds per segment
    easing: 'ease-in-out', // or custom (t) => number
    loop: true,            // A→B→C→A vs ping-pong
});

// Or custom interpolation:
const patrol = useWaypointPatrol(body, {
    waypoints: [pointA, pointB],
    duration: 4,
    interpolate: (from, to, t) => {
        // Arc motion
        const y = from[1] + (to[1] - from[1]) * t + Math.sin(t * Math.PI) * 2;
        return [lerp(from[0], to[0], t), y, lerp(from[2], to[2], t)];
    },
});

patrol.pause();
patrol.resume();
patrol.currentSegment;
patrol.direction;
```

## Acceptance Criteria

- [ ] `useWaypointPatrol(body, options)` sets kinematic body velocity to follow waypoints
- [ ] `speed` mode: constant velocity, linear interpolation
- [ ] `duration` mode: time-based with easing support
- [ ] Built-in easing presets: linear, ease-in, ease-out, ease-in-out
- [ ] Custom easing function: `easing: (t) => number`
- [ ] Custom interpolation: `interpolate: (from, to, t) => [x, y, z]`
- [ ] 2+ waypoints supported
- [ ] `loop` option: true = restart at first waypoint, false/default = ping-pong
- [ ] `pause()` / `resume()` control
- [ ] Full JSDoc with `@param`, `@returns`, `@example`
- [ ] Colocated tests
- [ ] Update platformer demo MovingPlatformNode and EnemyNode to use hook

## Notes

- **2026-02-26**: Ticket created. Identical 20-line patrol logic is duplicated between MovingPlatformNode and EnemyNode.
