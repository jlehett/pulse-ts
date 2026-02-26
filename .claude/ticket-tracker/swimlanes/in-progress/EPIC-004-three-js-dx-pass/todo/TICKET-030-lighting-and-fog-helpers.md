---
id: TICKET-030
epic: EPIC-004
title: Lighting and fog helper hooks
status: todo
priority: low
created: 2026-02-26
updated: 2026-02-26
---

## Description

Add declarative hooks to `@pulse-ts/three` for common scene setup: `useAmbientLight()`, `useDirectionalLight()`, and `useFog()`.

API:
```ts
useAmbientLight({ color: 0xb0c4de, intensity: 0.5 });

useDirectionalLight({
    color: 0xffffff,
    intensity: 1.0,
    position: [32, 25, 15],
    castShadow: true,
    shadowMapSize: 2048,
    shadowBounds: { near: 0.5, far: 100, left: -10, right: 72, top: 15, bottom: -12 },
});

useFog({ color: 0x0a0a1a, near: 40, far: 100 });
```

All hooks auto-add to scene and auto-remove on node destroy.

## Acceptance Criteria

- [ ] `useAmbientLight(options)` creates and adds an ambient light to the scene
- [ ] `useDirectionalLight(options)` creates a directional light with optional shadow config
- [ ] `useFog(options)` sets scene fog (and clears on destroy)
- [ ] All hooks auto-cleanup on node destroy
- [ ] Full JSDoc with `@param`, `@returns`, `@example`
- [ ] Colocated tests
- [ ] Update platformer demo LevelNode to use lighting helpers

## Notes

- **2026-02-26**: Ticket created. LevelNode has ~15 lines of direct Three.js light/shadow setup.
