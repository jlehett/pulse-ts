---
id: TICKET-034
epic: EPIC-006
title: useParticles callback-driven particle emitter
status: todo
priority: high
created: 2026-02-26
updated: 2026-02-26
---

## Description

Create `@pulse-ts/effects` package with a `useParticles()` hook providing a general-purpose particle system. Uses a callback-driven API (Option A) for maximum flexibility.

API:
```ts
const emitter = useParticles({
    maxCount: 100,
    size: 0.08,
    blending: 'additive',

    init: (p) => {
        p.lifetime = 0.6;
        p.velocity.randomDirection().scale(randomRange(2, 6));
        p.color.set(0xf4d03f);
    },

    update: (p, dt) => {
        p.velocity.y -= 9.8 * dt;
        p.opacity = 1 - p.age / p.lifetime;
    },
});

emitter.burst(20, position);      // one-shot burst
emitter.rate = 50;                 // continuous emission
emitter.emitting = true/false;     // toggle continuous
```

Per-particle state: `position`, `velocity`, `color`, `opacity`, `size`, `age`, `lifetime`, `userData` (arbitrary per-particle storage).

## Acceptance Criteria

- [ ] New `@pulse-ts/effects` package with proper structure
- [ ] `useParticles(options)` returns an emitter with `burst()` and continuous emission
- [ ] `init` callback called for each new particle
- [ ] `update` callback called each frame for each living particle
- [ ] Auto-applies velocity to position each frame (before user update callback)
- [ ] Particles auto-despawn when `age >= lifetime`
- [ ] `p.userData` available for arbitrary per-particle state
- [ ] Renders via Three.js Points with configurable blending
- [ ] Full JSDoc with `@param`, `@returns`, `@example`
- [ ] Colocated tests
- [ ] Update platformer demo to replace ParticleBurstNode with `useParticles`

## Notes

- **2026-02-26**: Ticket created. Callback-driven design supports fire, sparks, snow, vortex, trails, and any custom behavior via init/update callbacks.
