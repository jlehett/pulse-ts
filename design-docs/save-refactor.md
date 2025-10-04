# Refactor: `@pulse-ts/save`

Goals
- Clarify architecture using the repo’s layered conventions (public/domain/infra/utils).
- Make code easy to read and extend; minimize coupling via registries and adapters.
- Provide comprehensive, colocated unit tests for all public behaviors.
- Ensure public APIs have accurate JSDoc with minimal runnable examples.
- Align docs/guides with current APIs (fix outdated examples).

Scope
- Pure refactor and structure improvements; no breaking behavior changes intended.
- Add small internal test helpers to reset registries between tests.
- Update the guide in `apps/docs/guides/` for serializer API correctness.

Current State (Summary)
- Flat `src/` with `registries/`, `serializers/`, `hooks/`, and a `SaveFC` component.
- Public API exported via `src/index.ts` (saveWorld/loadWorld, defineFC/withSave, registries).
- No tests in the `save` package; docs have at least one outdated serializer example.

Design Overview

Layering
- public/
  - Light, function-first APIs that users import: `saveWorld`, `loadWorld`, `loadWorldRebuild`, `installSave`, `defineFC`, `withSave` and public types.
  - JSDoc with concise runnable examples.
- domain/
  - Core logic and data: registries for components/services/FCs; `SaveFC` metadata component; world save/load logic.
  - Registries expose narrow interfaces; include internal-only reset utilities for tests.
- infra/
  - Adapters/serializers for external packages: core components (Transform, Bounds, Visibility, State, StableId) and optional `@pulse-ts/three`.
  - The three adapter remains lazy/optional via dynamic import.
- utils/
  - Small pure helpers, if needed (none added initially beyond local helpers).

Public API (unchanged surface)
- `saveWorld(world, opts?): SaveFile`
- `loadWorld(world, save, opts?): void`
- `loadWorldRebuild(world, save, opts?): void`
- `installSave(world?, opts?): void`
- `defineFC(id, fc, opts?): FC`
- `withSave(id, opts?) => (fc) => FC`
- `registerComponentSerializer(ctor, serializer): void`
- `registerServiceSerializer(ctor, serializer): void`
- `registerCoreSerializers(): void`
- `registerThreeSerializers(): void`
- Types: `SaveFile`, `SaveNodeRecord`, `SaveOptions`, `LoadOptions`, `ComponentSerializer`

Testing Plan
- Registries
  - Register component/service serializers; verify serialize/deserialize behavior.
  - Provide internal `__reset...ForTests()` functions to isolate tests.
- saveWorld
  - Persists nodes, parent links, component payloads, optional time, and FC metadata when present.
- loadWorld (in-place)
  - Applies by StableId when present, else falls back to numeric id.
  - Honors `strict`, `resetPrevious`, and `applyTime` options.
- loadWorldRebuild
  - Clears scene (using `World.clearScene()` when present) and rebuilds hierarchy.
  - Remounts known FCs by saved id/props; warns but proceeds for unknown FCs.
  - Reapplies component data and optional time; honors `resetPrevious`.
- defineFC/withSave
  - Auto-register behavior and auto-attach SaveFC metadata on mount.

Docs Plan
- Fix `apps/docs/guides/save-load-stable-ids.md` serializer example (use `id`, `serialize`, `deserialize`).
- Ensure examples mirror JSDoc minimal examples.

Trade-offs
- Registries are module-singletons; explicit test reset helpers avoid cross-test contamination.
- Keeping optional peer adapters dynamic avoids hard deps and keeps API stable.

Approval & Next Steps
- If this structure and scope look good, implementation proceeds:
  1) Move files into layered folders and adjust imports.
  2) Add reset helpers (internal) and comprehensive unit tests.
  3) Update guide docs.
  4) Run `npm test -w packages/save --silent` and `npm lint:fix`.

