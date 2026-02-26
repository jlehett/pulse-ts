---
id: TICKET-028
epic: EPIC-004
title: useMesh declarative mesh creation hook
status: done
priority: high
created: 2026-02-26
updated: 2026-02-26
---

## Description

Add a `useMesh()` hook to `@pulse-ts/three` that combines geometry creation, material setup, shadow config, and `useObject3D` into a single declarative call.

API:
```ts
const { root, mesh, material, geometry } = useMesh('box', {
    size: [1, 1, 1],
    color: 0x4a6741,
    roughness: 0.8,
    castShadow: true,
    receiveShadow: true,
});
```

Supports standard Three.js geometry types: `'box'`, `'sphere'`, `'capsule'`, `'cylinder'`, `'icosahedron'`, `'octahedron'`, `'plane'`, `'cone'`, `'torus'`. Returns all internals so callers can still modify them (e.g. pulsing emissive).

## Acceptance Criteria

- [ ] `useMesh(type, options)` creates geometry, material, mesh, and attaches via `useObject3D`
- [ ] Internally calls `useThreeRoot()` and returns `root`
- [ ] Returns `{ root, mesh, material, geometry }` for downstream access
- [ ] Supports all common geometry types with typed options
- [ ] Material options support `color`, `roughness`, `metalness`, `emissive`, `emissiveIntensity`, `transparent`, `opacity`
- [ ] Shadow options: `castShadow`, `receiveShadow`
- [ ] Full JSDoc with `@param`, `@returns`, `@example`
- [ ] Colocated tests
- [ ] Update platformer demo nodes to use `useMesh`

## Notes

- **2026-02-26**: Ticket created. Every visual node in the platformer repeats the same 5-line mesh setup pattern.
- **2026-02-26**: Status changed to done. Implemented useMesh hook with type-safe geometry map (9 types), full JSDoc, 22 tests, and updated 9 demo nodes + 1 guide doc.
