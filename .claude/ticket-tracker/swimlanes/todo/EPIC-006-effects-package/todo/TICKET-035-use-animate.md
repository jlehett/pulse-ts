---
id: TICKET-035
epic: EPIC-006
title: useAnimate general-purpose animated values
status: todo
priority: medium
created: 2026-02-26
updated: 2026-02-26
---

## Description

Add `useAnimate()` to `@pulse-ts/effects` as a general-purpose time-varying value source. Returns values, not property setters — keeps it renderer-agnostic.

API — oscillation:
```ts
const bob = useAnimate({ wave: 'sine', amplitude: 0.2, frequency: 2 });
const spin = useAnimate({ rate: 2 });  // 2 units/sec, ever-increasing
const pulse = useAnimate({ wave: 'sine', min: 0.3, max: 0.9, frequency: 3 });

useFrameUpdate(() => {
    root.position.y = baseY + bob.value;
    mesh.rotation.y = spin.value;
    material.emissiveIntensity = pulse.value;
});
```

API — one-shot tween:
```ts
const fadeIn = useAnimate({ from: 0, to: 1, duration: 0.5, easing: 'ease-out' });
fadeIn.play();
fadeIn.value;     // current interpolated value
fadeIn.finished;  // boolean
fadeIn.reset();
```

## Acceptance Criteria

- [ ] Oscillation mode: `wave` (sine, triangle, square, sawtooth) + `amplitude`/`frequency` or `min`/`max`/`frequency`
- [ ] Rate mode: `rate` for linearly increasing values
- [ ] Tween mode: `from`/`to`/`duration`/`easing` with `play()`, `reset()`, `finished`
- [ ] Built-in easing presets: linear, ease-in, ease-out, ease-in-out
- [ ] Custom easing function support: `easing: (t) => t * t`
- [ ] `.value` auto-updates each frame
- [ ] Full JSDoc with `@param`, `@returns`, `@example`
- [ ] Colocated tests
- [ ] Update platformer demo spin/bob/pulse animations to use `useAnimate`

## Notes

- **2026-02-26**: Ticket created. Eliminates manual `elapsed` counters and sine-wave boilerplate across CollectibleNode, GoalNode, HazardNode, and EnemyNode.
