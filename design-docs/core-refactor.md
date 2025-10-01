# Core Refactor Plan (packages/core)

Purpose
- Make core easy to read, maintain, and extend without losing performance.
- Ensure comprehensive automated tests for public behavior and critical internals.
- Strengthen JSDoc across the public surface with clear, minimal examples.

Current State (snapshot)
- Layered structure is good: `public/` re-exports, `domain/` logic, `infra/` adapters, `utils/` helpers.
- Tests exist for many modules: FC hooks, World basics, traversal, component/service/system registries, Transform/Bounds, math, events.
- Gaps: no direct tests for CullingSystem, EngineLoop timing/alpha, Node lifecycle edge cases. JSDoc examples are uneven across hooks and components.
- Docs: API site is generated via TypeDoc. Some existing docs reference prior paths; regenerating will fix once public JSDoc is solid.

Non-Goals
- No semantic changes to public APIs unless they reduce complexity.
- No broad class-vs-function shifts; preserve current FC + ECS shape.

Proposed Changes (incremental, low-risk)
1) Tests
   - Add CullingSystem test using identity proj-view to validate visibility updates.
   - Add EngineLoop tests to verify fixed-step accumulation, alpha, pause/timeScale behavior at a unit level via ManualScheduler.
   - Add Node tests for reparent error cases and destroy() unlinking of registered ticks.

2) Documentation (JSDoc)
   - Enrich JSDoc for FC hooks (examples for useState/useChild and scheduling hooks), Transform/Bounds examples, Visibility summary, ManualScheduler usage.
   - Ensure params/returns are explicitly documented where missing.

3) Minor clarity refactors (no API changes)
   - Small comment clarifications in Transform caching branches where non-obvious.
   - Keep naming and structure intact; defer any deeper API reshapes until after feedback.

Acceptance Criteria
- `npm test -w packages/core --silent` passes with added coverage.
- No new lint/type errors (`npm lint:fix` in package passes).
- Publicly exported symbols have accurate JSDoc (with examples where relevant) and TypeDoc generates without warnings.

Open Questions
- Do we want typed, pluggable query utilities (e.g., world.query<Has<Transform, Bounds>>)? If yes, design separately.
- Should Service/System registries be unified under a small generic Registry helper? Can be a later pass.

Rollout
- Land tests + JSDoc improvements together.
- Follow up with a typedoc regenerate and docs page updates (guides/learn) if needed.

