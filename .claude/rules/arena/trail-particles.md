---
paths:
  - "demos/arena/src/**/*.ts"
---
# Trail Particles Visibility

## Requirement

Trail particles should **always be visible when a player is moving** — no hard velocity cutoff.

- Use velocity magnitude as a **scaling factor** for emission density: slower movement → sparser trails, faster movement → denser trails
- Never fully hide the trail due to low velocity
- Guard against stationary state only: `vmag > 0.1` is acceptable to avoid emission when truly idle

## Applies To

- **Gameplay:** `LocalPlayerNode`, `RemotePlayerNode` trail emission
- **Replay:** `ReplayNode` trail emission

## Configuration

- `TRAIL_VELOCITY_REFERENCE` in `demos/arena/src/config/arena.ts` is a **scaling reference**, NOT a cutoff threshold
- `TRAIL_BASE_INTERVAL` defines base emission interval; modulate via velocity factor to control density

## Example Pattern

```typescript
// vmag = velocity magnitude
const density = Math.max(1, vmag / TRAIL_VELOCITY_REFERENCE);
const interval = TRAIL_BASE_INTERVAL / density;

// Emit only if truly moving:
if (vmag > 0.1) {
  // emit particle with interval
}
```
