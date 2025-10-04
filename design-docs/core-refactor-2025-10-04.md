# Core Package Refactor Plan

Status: Proposal

Authors: Codex CLI assistant

Last updated: 2025-10-04

## Purpose

Make `@pulse-ts/core` cleaner, easier to understand, more maintainable, and more extensible. Prioritize discoverability (“find the thing I need fast”) and reduce implicit coupling.

## Goals

- Clarify layering and responsibilities in `packages/core/src`.
- Improve directory structure so code is easy to find by concept.
- Reduce coupling in `World` and public API; prefer opt-in defaults.
- Narrow the public surface to stable, documented, function-first APIs.
- Keep tests colocated and update them alongside structure changes.

## Non‑Goals

- No runtime behavior feature additions. This is a structural refactor only.
- No cross-package API changes outside `@pulse-ts/core` (follow-ups allowed).

## Current State (high-level)

`packages/core/src`
- public/ — curated exports
- domain/
  - ecs/ (base, query, registry)
  - fc/ (runtime + hooks)
  - world/ (world orchestration, loop, ticker, sceneGraph)
  - services/, systems/
- infra/scheduler/ — RAF/Timeout/Manual
- utils/ — math, events

Observations
- Structure is already layered and tidy. Biggest opportunity: “world” is an orchestration hub that currently owns time (loop/ticker), scene graph, and installs default systems/services. That increases coupling and file size.
- `public/types.ts` re-exports internal types wholesale (includes `TickRegistration` internals).
- Schedulers live in `infra` but aren’t re-exported via public surface; yet `WorldOptions` accepts a `scheduler`, creating a discoverability mismatch.

## Proposed Changes

1) Extract time concerns from `domain/world` to `domain/time`
- Move files:
  - `domain/world/loop.ts` → `domain/time/loop.ts`
  - `domain/world/ticker.ts` → `domain/time/ticker.ts`
- Update imports in `world.ts` accordingly.
- Rationale: Separates “time & scheduling” from world orchestration; makes it easier to find and reason about time-related code.

2) Extract scene graph to `domain/scene`
- Move `domain/world/sceneGraph.ts` → `domain/scene/sceneGraph.ts`
- Keep types for parent change events under `domain/scene/events.ts` (move from `domain/world/events.ts`).
- Rationale: World composes a scene graph; locating the graph under `scene/` improves discoverability.

3) Decouple default systems/services from `World`
- Remove implicit installation of `StatsService` and `CullingSystem` from `World` constructor.
- Add public bootstrap helpers:
  - `public/bootstrap.ts` exporting:
    - `installDefaults(world: World): void` (installs `StatsService` and `CullingSystem`).
- Update tests to explicitly call `installDefaults` where needed.
- Rationale: Reduce implicit coupling; keep `World` minimal. Defaults become opt-in and visible at callsite.

4) Public API cleanup and discoverability
- Add `public/scheduler.ts` to re-export `Scheduler`, `RafScheduler`, `TimeoutScheduler`, `ManualScheduler` as public adapters for injection.
- Narrow `public/types.ts` to export only stable types: `UpdateKind`, `UpdatePhase`, `TickFn`, `ComponentCtor`, `Ctor`.
  - Stop re-exporting internal `TickRegistration`.
- Ensure all public exports have JSDoc and minimal runnable examples. For re-exports, add doc blocks in the public shim files.

5) File tree after refactor (core only)

packages/core/src
- public/
  - index.ts
  - world.ts
  - ecs.ts (optional: split from world.ts if preferred)
  - fc.ts
  - components.ts
  - systems.ts
  - services.ts
  - queries.ts
  - math.ts
  - events.ts
  - scheduler.ts   ← new
  - bootstrap.ts   ← new
  - types.ts       ← narrowed exports
- domain/
  - ecs/
    - base/
    - query/
    - registry/
  - fc/
  - time/
    - loop.ts
    - ticker.ts
  - scene/
    - sceneGraph.ts
    - events.ts
  - world/
    - world.ts (orchestration; composes time + scene + registries)
  - services/
  - systems/
- infra/
  - scheduler/
- utils/
  - math/
  - event.ts

6) Tests
- Update imports for moved files. Keep tests colocated.
- Add small tests for `installDefaults` and public `scheduler` access.
- Update any tests that assumed default systems/services were installed by `World`.

7) Docs
- Update VitePress guides where snippets show `new World()` usage to include `installDefaults(world)` in quickstarts where defaults are expected (e.g., culling demos).
- Add an “Engine Setup” guide section covering `WorldOptions`, schedulers, and bootstrap options.
- Ensure JSDoc examples in public files mirror the guides.

## Breaking Changes

- `World` no longer installs `StatsService` and `CullingSystem` automatically. Use `installDefaults(world)` from `@pulse-ts/core` instead.
- `public/types.ts` no longer exports `TickRegistration` internals.
- Import paths for internal tests that referenced `domain/world/{loop,ticker,sceneGraph}` will change.

## Migration

- Where code relied on default systems/services:
  ```ts
  import { World, installDefaults } from '@pulse-ts/core'
  const world = new World()
  installDefaults(world)
  ```

- Where custom scheduling is needed:
  ```ts
  import { World } from '@pulse-ts/core'
  import { ManualScheduler } from '@pulse-ts/core' // via public/scheduler
  const world = new World({ scheduler: new ManualScheduler() })
  ```

- Types: replace imports that referred to `TickRegistration` with usage of higher-level APIs; avoid depending on its internals.

## Rationale & Trade‑offs

- Pros: Clearer mental model; smaller `World`; easier navigation; cleaner public surface; better testability (opt-in defaults); fewer unintended couplings.
- Cons: Minor migration for existing tests/snippets; two extra public modules (`scheduler`, `bootstrap`).

## Rollout Plan

1. Move files and update imports (time, scene) with zero behavior change.
2. Add `public/scheduler.ts` and `public/bootstrap.ts`.
3. Remove default installs from `World` and update tests.
4. Narrow `public/types.ts` and fix any type usage.
5. Update docs (guides + learn) and public JSDoc blocks.
6. Lint and run tests for `@pulse-ts/core` and dependents.

## Open Questions

- Keep `events.ts` under `utils` + `public/events` re-export, or move under `domain/scene`? Proposal: keep in `utils` as it’s domain-agnostic.
- Do we want an additional `presets/` module for grouped installs (e.g., “rendering defaults”)? Out of scope for this pass.

