---
paths:
  - "demos/arena/src/**/*"
---
# Arena Scene Graph Structure

## Hierarchy

The scene is structured with a parent Group wrapping player entities:

```
scene (root)
├── AmbientLight
├── DirectionalLight
├── PointLight(s)
└── Group (y = 0, parent container)
    └── Group (y ≈ 1.05, actual player)
```

**Critical:** Player entities are **nested** inside a parent Group at the scene root. They are NOT direct `scene.children`.

## Finding Players at Runtime

**Incorrect:**
```typescript
scene.children.forEach(child => {
  if (child.position.y > 0.5) { /* ... player found */ }
});
```
This finds nothing because `scene.children` contains only lights and the parent Group (at y=0).

**Correct:**
```typescript
scene.traverse(node => {
  if (node instanceof THREE.Group && node.position.y > 0.5) {
    // This is a player entity
  }
});
```

Use `scene.traverse()` to recursively visit all descendants, including nested players.

## Related

- `demos/arena/src/nodes/AtmosphericDustNode.ts` — Fixed via traverse() pattern
