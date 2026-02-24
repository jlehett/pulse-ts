---
id: TICKET-3
title: Add useMesh() convenience hook to @pulse-ts/three
status: open
priority: medium
epic: EPIC-2
created: 2026-02-18
---

# TICKET-3: Add useMesh() convenience hook to @pulse-ts/three

## Problem

Creating a visible 3D object currently requires 5+ lines: instantiate geometry, instantiate material, create mesh, configure shadows, call `useObject3D()`. This boilerplate is repeated in every node that renders anything.

## Acceptance Criteria

- [ ] `useMesh(geometry, material, opts?)` hook added to `@pulse-ts/three` public API
- [ ] `opts` supports at minimum: `castShadow`, `receiveShadow`
- [ ] Hook calls `useObject3D()` internally — caller does not need to call it separately
- [ ] Hook is typed: geometry and material types flow through to the returned mesh type
- [ ] Demo updated to use `useMesh()` where applicable (player, platforms, collectibles)
- [ ] JSDoc with `@param`, `@returns`, `@example`
- [ ] Tests cover hook registration and shadow flag propagation

## Before / After

**Before:**
```ts
const geo = new THREE.CapsuleGeometry(0.4, 0.8);
const mat = new THREE.MeshStandardMaterial({ color: 0x00bcd4 });
const mesh = new THREE.Mesh(geo, mat);
mesh.castShadow = true;
useObject3D(mesh);
```

**After:**
```ts
const mesh = useMesh(
  new THREE.CapsuleGeometry(0.4, 0.8),
  new THREE.MeshStandardMaterial({ color: 0x00bcd4 }),
  { castShadow: true },
);
```
