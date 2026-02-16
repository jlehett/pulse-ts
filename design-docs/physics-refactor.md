# @pulse-ts/physics – Refactor Plan (Layout, Boundaries)

Status: In progress
Owner: Codex
Scope: packages/physics (public API, tests, docs)

## Goals
- Align physics package layout with the project-wide layered structure (public/domain/infra) used in `@pulse-ts/network`.
- Keep the public API untouched (install helper, hooks, components, helpers) while clarifying where implementation details live.
- Co-locate every test with the module it covers to simplify future changes.

## Current Snapshot
- `src/` now has clear `public/` vs `domain/` boundaries, but the physics engine internals still sit in a single folder that feels crowded.
- Engine modules (broadphase, detection, integrator, solver, raycast) could be grouped further to aid navigation and future extension.
- Tests exist for most helpers but would benefit from mirroring the refined folder layout.
- Docs mention APIs but not the evolving folder structure.

## Issues / Opportunities
- While the top-level split is in place, engine internals remain too flat; related algorithms should be grouped (e.g., broadphase vs detection).
- Helpers (`filters`, `materials`) have been namespaced but the engine layer still mixes unrelated responsibilities.
- Tests should continue to travel with their modules as we add subfolders.

## Proposal

### Layout
```
packages/physics/src/
  public/
    install.ts
    hooks.ts
    components/
      RigidBody.ts
      Collider.ts
  domain/
    types.ts
    filters/
      filters.ts
      filters.test.ts
    materials/
      materials.ts
      materials.test.ts
    engine/
      core/
        engine.ts
      broadphase/
        aabb.ts
        aabb.test.ts
        pairing.ts
        pairing.test.ts
        pairing.naive.test.ts
      detection/
        detect.ts
        detect.test.ts
        detect.boxbox.test.ts
      dynamics/
        integration.ts
        inertia.ts
        inertia.test.ts
      filter/
        filter.ts
      raycast/
        raycast.ts
        raycast.unit.test.ts
        raycast.normal.test.ts
      solver/
        solver.ts
        solver.unit.test.ts
    services/
      PhysicsService.ts
    systems/
      PhysicsSystem.ts
  index.ts (public barrel adjusted to new paths)
```

Notes:
- `public/hooks.ts` remains the FC entry point; imports update to pull from `domain` modules.
- `PhysicsService` lives under `domain/services` and re-exports the existing `CollisionPair` type, depending on the new `domain/engine/*` modules.
- `PhysicsSystem` stays under `domain/systems` to mirror other packages' system placement.
- Helpers (`filters`, `materials`) live under `domain/` with colocated tests, and the full engine internals are organized by concern.
- Additional folders (infra) can be introduced later if/when we add IO/platform adapters.

### Tests
- Keep every test beside the module it validates (including the new `domain/engine/**` subfolders) so changes stay localized.
- Update import paths inside the tests to match the refined layout; no behavior changes expected.

## Rollout Plan
1. Move files into the proposed directories using git-aware commands to retain history.
2. Update all relative imports and public exports in `index.ts`.
3. Verify Jest + lint for the physics package (`npm test -w packages/physics --silent`, `npm run lint:fix -w packages/physics`).

## Risks / Mitigations
- Large diff from file moves → mitigated by using git mv and running the full package tests to ensure no regression.
- Potential circular imports after restructuring → monitor during implementation; adjust boundaries if necessary.

## Open Questions
- Do we want to introduce an `infra/` folder now (e.g., for future native bindings), or keep `domain/` for all engine internals until such deps exist?

## Implementation Status
- ✅ Public modules (`install`, hooks, components) live under `src/public/` with unchanged APIs.
- ✅ Domain modules (`types`, filters, materials, PhysicsService, PhysicsSystem, engine internals) live under `src/domain/` with colocated tests.
- ✅ Engine internals are grouped under `src/domain/engine/` by responsibility (core, broadphase, detection, dynamics, solver, raycast, filter) and all tests moved with them.
- ✅ Index barrel updated along with all imports; package lint/tests pass under the new structure.
