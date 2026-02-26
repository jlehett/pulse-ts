---
id: TICKET-024
epic: EPIC-002
title: "Platform riding: player moves with kinematic platforms"
status: todo
priority: high
created: 2026-02-25
updated: 2026-02-25
---

## Description

When the player stands on a moving or rotating kinematic platform, they should move with it — translated horizontally for moving platforms and carried rotationally for spinning platforms.

The physics solver's friction impulse is clamped by `mu * jn`, and at resting contact `jn ≈ 0`, so no friction-based carrying happens automatically. The fix must be explicit in-game logic in `PlayerNode`.

### Approach

In `PlayerNode.useFixedUpdate`, the player already raycasts downward to detect ground. The raycast hit includes `hit.node`, which allows retrieving the platform's `RigidBody` via `getComponent(hit.node, RigidBody)`.

When standing on a kinematic body:

1. **Translating platform** — read `platformBody.linearVelocity` and add it to the player's position delta (or add the XZ component to the player's velocity before physics runs).

2. **Rotating platform** — compute the tangential velocity at the player's contact point using `ω × r` where `ω = platformBody.angularVelocity` and `r = hit.point - platform.localPosition`. Add this tangential velocity to the player's movement.

No changes to the physics solver are needed. All logic is in `PlayerNode`.

## Acceptance Criteria

- [ ] Player translates with a moving platform when standing on it (no sliding off)
- [ ] Player rotates with a rotating platform when standing on it (carried around the center)
- [ ] Player can still jump normally while on a moving/rotating platform
- [ ] Player separates cleanly from the platform when they jump or walk off
- [ ] Existing player movement and jump tests (if any) still pass

## Notes

- **2026-02-25**: Ticket created. Spawned from TICKET-011 (moving/rotating platforms). Solver friction at resting contact produces near-zero impulse (jn ≈ 0), so explicit velocity inheritance in PlayerNode is required.
