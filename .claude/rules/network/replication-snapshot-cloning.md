# Replication Snapshots: Clone Mutable References

**Paths:** `packages/network/src/public/transform.ts`, `packages/network/src/domain/replication/protocol.ts`

## The Problem

`shallowDelta` uses **reference equality** (`a !== b`) to detect changes between snapshots. If a `read()` function returns the same mutable object reference across calls, `shallowDelta` sees "no change" and **silently drops the field from all subsequent snapshots**.

### Example: Returning a Live Vec3

```typescript
// WRONG: returns the same Vec3 instance every time
readVelocity: () => body.linearVelocity
```

- Snapshot 1: `data.v = body.linearVelocity` (ref A). Stored as `rec.last.v = ref A`.
- Snapshot 2: `data.v = body.linearVelocity` (ref A). `now.v !== last.v` → `false`. **Velocity dropped.**
- Result: consumer only receives the initial velocity value; all updates are lost.

## The Fix

Always return **plain object copies** from `read()` for any field backed by a mutable reference:

```typescript
// CORRECT: new plain object each call, shallowDelta sees distinct references
if (readVelocity) {
    const rv = readVelocity();
    data.v = { x: rv.x, y: rv.y, z: rv.z };
}
```

Position/rotation/scale already work correctly because `read()` creates fresh `{ x, y, z }` object literals each call — they're never the same reference.

## When This Applies

Any `useReplication` producer that includes data from:
- Physics body properties (`linearVelocity`, `angularVelocity`)
- Component fields that return mutable class instances (Vec3, Quat, etc.)
- Any getter that returns a cached/singleton reference

## Impact of the Bug

- Remote player velocity stuck at initial value (~0)
- Knockback calculation uses near-zero approach speed → only base knockback (12) instead of full (31.2)
- Dead-reckoning between snapshots uses stale velocity → jerky remote movement
- Equal-mass collision correction produces wrong result (treats remote as stationary)
