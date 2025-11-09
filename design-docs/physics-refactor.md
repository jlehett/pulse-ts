# @pulse-ts/physics – Refactor Plan (Layout, Boundaries)

Status: In progress
Owner: Codex
Scope: packages/physics (public API, tests, docs)

## Goals
- Align physics package layout with the project-wide layered structure (public/domain/infra) used in `@pulse-ts/network`.
- Keep the public API untouched (install helper, hooks, components, helpers) while clarifying where implementation details live.
- Co-locate every test with the module it covers to simplify future changes.

## Current Snapshot
- Flat-ish `src/` folder containing `components/`, `fc/`, `services/`, `systems/`, helpers (filters/materials), and shared types.
- Physics engine internals live under `services/physics/` but public modules import them via relative paths.
- Tests already exist for most helpers but are mixed between root-level files and the `services/physics` folder.
- Docs mention APIs but not the evolving folder structure.

## Issues / Opportunities
- Lacks the clear boundary separation used elsewhere, making it harder to find public vs. domain code.
- Installer/hooks/components live alongside low-level engine code.
- Some helpers (`filters`, `materials`) sit at src root without a namespace, which becomes noisy as the package grows.
- Contributors need to scan multiple directories to find colocated tests.

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
    services/
      PhysicsService.ts
      physics/
        engine.ts
        integrator.ts
        inertia.ts
        detect.ts
        pairing.ts
        raycast.ts
        solver.ts
        ... (existing modules + tests)
    systems/
      PhysicsSystem.ts (from systems/step.ts)
  index.ts (public barrel adjusted to new paths)
```

Notes:
- `public/hooks.ts` remains the FC entry point; imports update to pull from `domain` modules.
- `PhysicsService` moves under `domain/services` and re-exports the existing `CollisionPair` type.
- `PhysicsSystem` lives under `domain/systems` to mirror other packages' system placement.
- Helpers (`filters`, `materials`) move under `domain/` with colocated tests.
- Additional folders (infra) can be introduced later if/when we add IO/platform adapters.

### Tests
- Rename/move test files alongside their modules (already true for `services/physics/*.test.ts`; new structure keeps it consistent for filters/materials/services/systems).
- Update import paths inside the tests to match the new layout; no behavior changes expected.

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
- ✅ Index barrel updated along with all imports; package lint/tests pass under the new structure.
