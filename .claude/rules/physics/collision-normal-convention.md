---
paths:
  - "packages/physics/src/domain/engine/detection/**/*"
  - "packages/physics/src/domain/engine/solver/**/*"
---

# Collision Normal Convention

- Contact normals returned from `detectCollision(a, b)` must point **from A toward B** — this is the critical convention that enables the impulse solver to correctly separate overlapping bodies
- The solver in `solver.ts` computes `rv = v_B - v_A` and `vrel = rv · n`, then applies impulse `j = n * jn` where A gets `va -= j * invMassA` and B gets `vb += j * invMassB`; the direction of `n` determines which body moves in which direction
- Individual collision helper functions return normals in different directions:
  - `sphereSphere`: returns `(B - A) / |B - A|` → already A→B direction ✓
  - `spherePlane`: returns `-planeNormal` → points from sphere toward plane (A→B) ✓
  - `sphereOBB`: returns box→sphere direction (B→A) → the dispatch **must negate** when `a=sphere, b=box`
  - `sphereCylinder`: returns cylinder→sphere direction (B→A) → the dispatch **must negate** when `a=sphere, b=cylinder`
  - `cylinderBox`: returns box→cylinder direction (B→A) → the dispatch **must negate** when `a=cylinder, b=box`
  - `cylinderPlane`: returns `-planeNormal` → points from cylinder toward plane (A→B) ✓
- When adding a new collision type: if the helper function returns "normal from B toward A", follow the `sphereOBB` pattern and negate the result in the dispatch for the case where the helper's "B" is the dispatcher's "a"
