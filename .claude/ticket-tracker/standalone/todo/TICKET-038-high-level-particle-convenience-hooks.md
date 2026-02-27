---
id: TICKET-038
title: High-level particle convenience hooks (useParticleBurst / useParticleEmitter)
status: todo
priority: medium
created: 2026-02-26
updated: 2026-02-26
labels: effects,dx
---

## Description

Add high-level convenience hooks to `@pulse-ts/effects` that simplify common particle patterns without requiring manual context wiring or scene-level setup.

Currently, using particles requires:
1. Calling `useParticles()` in a long-lived ancestor node (e.g. LevelNode)
2. Sharing the emitter via `useProvideContext`
3. Consumers calling `useContext` to get the emitter and manually calling `burst()` with `initOverride`

This is verbose and error-prone. Individual nodes should be able to declare their particle behavior self-contained.

## Proposed API

### `useParticleBurst` — one-shot effects (stomps, pickups, explosions)

```ts
const burst = useParticleBurst({
    count: 24,
    lifetime: 0.5,
    color: 0xcc2200,
    speed: [1.5, 4],
    gravity: 9.8,
});

// Fire at a position — particles outlive the calling node
burst([x, y, z]);
```

### `useParticleEmitter` — continuous effects (flames, smoke, trails)

```ts
const flames = useParticleEmitter({
    rate: 50,
    lifetime: 0.8,
    color: 0xff4400,
    speed: [0.5, 1.5],
    gravity: -2,
});

// Auto-follows node transform, auto-stops on node destroy
// In-flight particles survive node destruction in the shared pool
flames.pause();
flames.resume();
```

### Backing service — `ParticlesService`

A world-level service (similar to `PhysicsService`) that manages shared particle pools. Pools are lazily created and grouped by compatible rendering config (blending mode, base size, etc.).

- `installParticles(world, options?)` for setup
- Both convenience hooks talk to the service internally
- `useParticles()` remains as the low-level escape hatch for full control

## Design Constraints

- Particles must outlive the triggering node (burst on enemy stomp → enemy destroyed → particles linger)
- Continuous emitters stop spawning on node destroy, but in-flight particles fade naturally
- Multiple pools supported for different blending modes, capacity isolation, or render order
- Pool grouping should be automatic for the common case (users don't think about pools)
- `useParticles()` stays unchanged as the low-level primitive

## Notes

- **2026-02-26**: Created from DX discussion. Current context-based wiring in the platformer demo (LevelNode → ParticleEffectsCtx → EnemyNode/CollectibleNode) motivates this improvement.
