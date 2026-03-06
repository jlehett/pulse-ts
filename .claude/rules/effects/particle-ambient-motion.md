---
paths:
  - "packages/effects/src/**/*"
  - "demos/arena/src/nodes/**/*"
---
# Particle Ambient Motion: Position vs Velocity

## Position-Based Ambient Motion (Preferred)

For continuous background particle movement (orbit, curl noise, wind), use **position-based updates**:

```typescript
particle.position.x += velocityField.x * dt;
particle.position.y += velocityField.y * dt;
```

**Why this works:**
- Particles drift smoothly via the field without accumulating kinetic energy
- No permanent momentum; motion is purely drift through space
- Clean separation of concerns: ambient motion field defines behavior, particles follow passively
- No energy buildup or jitter from accumulated forces

## Velocity-Based Ambient Motion (Avoid)

**Do NOT** use velocity-based ambient motion:

```typescript
// AVOID THIS
particle.velocity.x += fieldForce.x * dt;
particle.velocity.y += fieldForce.y * dt;
```

**Why this fails:**
- Particles accumulate permanent momentum and fly outward over time
- Velocity persists even after the field changes
- Causes visible "bursting" and energy drift
- Requires expensive post-processing (drag, dampening, density grids) to stabilize

## Player-Particle Interaction: Displacement, Not Impulse

When a player moves through a particle field, use **temporary position displacement**, not velocity-based push.

### Pattern: Position-Based Push

```typescript
// In player update loop, for each nearby particle:
const toPlayer = player.position.sub(particle.position);
const dist = toPlayer.length();
if (dist < pushRadius) {
  const pushForce = (1 - dist / pushRadius); // fade with distance
  const direction = toPlayer.normalize();
  particle.position.add(direction.multiplyScalar(pushForce * dt));
}
```

**Why this works:**
- Particles are **displaced** like a force field while the player is nearby
- No permanent velocity is imparted; position changes only while player is in range
- When the player leaves, particles naturally drift **back** via ambient motion (orbit, curl noise)
- Density is **automatically maintained** — no equalization grids needed

### Anti-Pattern: Velocity-Based Push

```typescript
// AVOID THIS
particle.velocity.add(direction.multiplyScalar(pushForce));
```

**Why this fails:**
- Particles gain permanent velocity and **fly away permanently**
- Even after the player leaves, particles keep moving outward
- Density becomes sparse and scattered
- Recovery requires expensive density equalization, which causes:
  - Grid-based particle relocation (visible herding artifacts)
  - Drag/dampening (jitter and unnatural motion)
  - Both destroy the smooth ambient behavior

### Benefits of Position-Based Push

1. **Temporary effect** — particle displacement is only active while player is nearby
2. **Auto-recovery** — ambient motion pulls particles back when player moves away
3. **No density artifacts** — no need for grids, drag, or complex post-processing
4. **Smooth composition** — position displacement + ambient motion = natural particle behavior
5. **Tunable** — control push radius and strength independently of ambient motion

## Related Files

- `packages/effects/src/domain/ParticlesService.ts` — core particle update loop
- `demos/arena/src/nodes/LocalPlayerNode.ts` — player movement and collision
- `demos/arena/src/nodes/ParticleEffectNode.ts` — effect lifecycle and interaction
