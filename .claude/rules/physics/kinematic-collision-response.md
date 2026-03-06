# Kinematic Bodies Absorb Zero Collision Response

**Paths:** `packages/physics/src/domain/engine/solver/solver.ts`, `packages/physics/src/domain/services/PhysicsService.ts`, `demos/arena/src/nodes/LocalPlayerNode.ts`

## The Problem

The physics solver computes `invMass` as 0 for kinematic and static bodies:

```typescript
const invMassA = rbA && rbA.type === 'dynamic' ? rbA.inverseMass : 0;
```

When a dynamic body collides with a kinematic body, the kinematic body acts as an immovable wall — **100% of the collision response** goes to the dynamic body. Between two equal-mass dynamic bodies, it's split 50/50.

## Why This Matters for Networked Games

Remote players are kinematic (position driven by replication). The local dynamic player bounces off the remote kinematic player incorrectly — the solver ignores the kinematic body's velocity entirely, producing wrong results especially when both players are moving toward each other.

## Collision Callback Timing (Critical)

`useOnCollisionStart` fires **AFTER** the physics solver has already resolved the contact:

```
PhysicsService.step():
  1. Broadphase detection
  2. Narrowphase → contact manifolds
  3. collisions.emit(pair)           ← continuous collision events
  4. Collect constraints (non-trigger)
  5. correctPositions()              ← position correction
  6. solveContactsIterative()        ← velocity impulses applied
  7. collisionStart.emit(pair)       ← useOnCollisionStart fires HERE
```

This means `body.linearVelocity` in a `useOnCollisionStart` callback **already includes the solver's bounce**. Any impulse applied in the callback is additive on top of the physics bounce.

## Solution: Equal-Mass Collision Formula Along Normal

The solver's bounce is wrong because it treats the kinematic body as having zero velocity. Fix by replacing the normal velocity component with the proper equal-mass elastic collision result, using the remote player's known velocity from the replication layer:

```typescript
let prePhysVx = 0, prePhysVz = 0;
useFixedEarly(() => {
    prePhysVx = body.linearVelocity.x;
    prePhysVz = body.linearVelocity.z;
});

useOnCollisionStart(({ other }) => {
    const [otherVx, otherVz] = getPlayerVelocity(otherPlayerId);

    // Collision normal: from self toward other
    const cdx = otherPos.x - selfPos.x;
    const cdz = otherPos.z - selfPos.z;
    const clen = Math.sqrt(cdx * cdx + cdz * cdz);
    if (clen > 0.01) {
        const nx = cdx / clen;
        const nz = cdz / clen;
        // Pre-solver normal velocities
        const myNormal = prePhysVx * nx + prePhysVz * nz;
        const otherNormal = otherVx * nx + otherVz * nz;
        // Equal-mass collision formula (e = combined restitution)
        const e = 0.2;
        const correctedNormal = ((1 - e) / 2) * myNormal
                              + ((1 + e) / 2) * otherNormal;
        // Replace solver's normal component with corrected value
        const solverNormal = body.linearVelocity.x * nx
                           + body.linearVelocity.z * nz;
        body.linearVelocity.x += (correctedNormal - solverNormal) * nx;
        body.linearVelocity.z += (correctedNormal - solverNormal) * nz;
    }
    // Apply custom knockback on top
    body.applyImpulse(ix, iy, iz);
});
```

### Why the old halving approach failed

The previous approach `(prePhysVx + postPhysVx) * 0.5` only works when the kinematic body is **stationary**. When both players rush at each other (e.g., dashing at speed 24):

- **Local play** (two dynamic bodies): `v = 0.4*24 + 0.6*(-15) = 0.6` (nearly stopped)
- **Old halving**: `v = (24 + (-4.8)) / 2 = 9.6` (still moving toward opponent!)

The knockback base of 12 barely overcomes 9.6, causing players to "stick" together instead of bouncing apart.

The proper formula accounts for the kinematic body's actual velocity, producing the correct result for all cases — stationary, same-direction, and head-on collisions.

Keep Y velocity untouched — gravity and platform collisions should still work normally. The solver still provides position correction (prevents overlap).

## Why NOT Trigger Colliders

Setting `isTrigger: true` skips BOTH position correction AND velocity response. This causes players to phase through each other with no physical separation. Triggers are wrong when you need position correction but want to control velocity yourself.

## Related

- `demos/arena/src/nodes/RemotePlayerNode.ts` — Kinematic body with `restitution: 0, friction: 0` to minimize residual physics effects
- `demos/arena/src/nodes/LocalPlayerNode.ts` — Pre-solver velocity capture + equal-mass correction pattern
- `demos/arena/src/playerVelocity.ts` — Remote player velocity store (from replication snapshots)
