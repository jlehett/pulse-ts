# Particle Pool Sizing: Shared Capacity Per Blending Mode

**Paths:** `packages/effects/src/domain/ParticlesService.ts`, `demos/arena/src/nodes/ArenaNode.ts`

## Critical Constraint

The particle pool is **shared per blending mode**. All `useParticleBurst` and `useParticleEmitter` hooks with the same `blending` option (e.g., `'additive'`) draw from a single fixed-capacity pool managed by `ParticlesService`.

Pool size is set **once** at init via `installParticles({ maxPerPool: N })`.

## Silent Overflow Risk

If the pool overflows, older particles are silently recycled before finishing their lifetime. This causes **visible cutoffs** — particles disappear early without warning.

## Pool Capacity Calculation

For **each effect**, multiply:
- `emission_rate` (particles/sec)
- `particles_per_burst` (if using burst mode)
- `lifetime` (seconds)

**Sum across all effects sharing the blending mode.** The `maxPerPool` must exceed this sum at **peak usage**.

### Formula
```
maxPerPool >= Σ(emission_rate × particles_per_burst × lifetime)
  for all effects with the same blending mode
```

## Arena Demo Example

Trail particles (2 players × 100 bursts/sec × 8 particles × 1.0s) + impact bursts (16 particles) + knockout burst (80 particles) ≈ **1700 peak particles**.

Pool was set to **256**, causing trail cutoff. Fixed by increasing to **2048**.

## Action Items

When increasing emission rates or adding new particle effects:

1. Identify the blending mode (`'additive'`, `'alpha'`, etc.)
2. List all effects sharing that mode
3. Recalculate peak capacity using the formula above
4. Update `maxPerPool` in the caller (e.g., `ArenaNode`)
5. Monitor runtime for silent recycling (particles disappearing early)
