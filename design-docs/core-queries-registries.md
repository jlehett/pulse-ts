# Core: Queries and Registries — Simplification and Tests

Status: Draft

Owner: core

Last updated: 2025-10-03

Goals
- Make queries and registries easy to understand and extend.
- Centralize constructor typing to remove duplication.
- Ensure thorough tests cover public behavior.
- Preserve clear layering and function-first public APIs.

Non-goals
- Implement a complex, incremental query index. Current runtime favors clarity; revisit once needed.

Current State (summary)
- Queries: `defineQuery` and `query` live in `domain/ecs/queries.ts`. They scan `world.nodes` each run, use `getComponent` to match `has` and `not` sets, and yield typed tuples `[node, ...components]`.
- Registries: `ServiceRegistry` and `SystemRegistry` wrap a generic `CtorRegistry` keyed by constructors.
- Typing: A `ComponentCtor` type alias exists local to `queries.ts`; `Ctor<T>` lives in `domain/ecs/types.ts`.

Pain Points
- Duplicate definition of component constructor typing between `queries.ts` and other modules.
- Missing direct tests for `System` attach/detach + static `order` behavior (implicitly covered via `CullingSystem`).

Proposed Changes
1) Type Centralization
   - Add `ComponentCtor<T extends Component>` to `domain/ecs/types.ts` and import it wherever needed (e.g., queries, world sugar).
   - Rationale: keeps constructor typing in one place with discoverable JSDoc.

2) Tests for System behavior
   - Add isolated tests for `System` attach/detach and `static order` execution ordering to avoid relying on indirect coverage.

3) Documentation touch-ups
   - Ensure `ComponentCtor` has a usage example.
   - Retain existing `defineQuery` and `query` docs with runnable snippets.

Alternatives Considered (later)
- Query indexing via per-component sets and incremental updates.
  - Pros: reduces repeated full scans for hot queries.
  - Cons: added complexity and mutation bookkeeping; not yet needed.
  - Decision: defer; current approach is simple and well-tested. When performance demands, introduce an internal index behind the same public API.

Impact
- Public API: additive only (`ComponentCtor` is now exported via `public/types`). No breaking changes.
- Internals: queries and world sugar updated to import the centralized type.
- Tests: new coverage for `System` lifecycle and ordering.

Rollout
- Update types and references.
- Add tests.
- Run: `npm test -w packages/core --silent` and `npm lint:fix -w packages/core`.

Open Questions
- Should `ComponentCtor` be named `CtorOf<T>` for consistency with `Ctor<T>`? Chose explicit name for clarity at call sites.

