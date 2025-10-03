# Core Queries: Internal Indexing (Proposal)

Status: Proposal

Owner: core

Last updated: 2025-10-03

Goals
- Improve query performance for large worlds while keeping the public API unchanged.
- Maintain clarity and low coupling across layers; prefer simple, testable internals.

Non-goals
- No public API changes to `defineQuery`, `query`, or `world.query`.
- No complex, incremental join planners or bitset signatures in the first iteration.

Constraints
- Multi-world support: the engine can host multiple `World` instances.
- Components can be attached before or after adding a `Node` to a `World`.
- We do not currently support component removal; `Node.destroy()` is the removal event we can rely on.

Summary
We add an internal per-component index that maps a component constructor to a `Set<Node>`. `defineQuery` will use the smallest available component set as its candidate base and filter in-World and other `has`/`not` constraints. This preserves behavior, improves common cases (queries with 1+ `has`), and keeps code straightforward.

Design
1) Data structure
- Global index: `Map<ComponentCtor, Set<Node>>` in `domain/ecs/queryIndex.ts`.
  - Rationale: avoids per-world coupling and extra world-hooks; queries already filter by `world.nodes` membership.
  - Memory: holds strong refs to nodes that have the component. We remove on `Node.destroy()` to avoid stale refs.

2) Write-path updates
- On `setComponent(owner, value)` (already the central mutation point), register `owner` into the set for `value.constructor`.
- On `attachComponent(owner, Ctor)`, we reuse `setComponent`, so no separate work.
- On `Node.destroy()`, remove the node from all component sets.

3) Read-path in `defineQuery`
- If `has.length === 0`: fall back to scanning `world.nodes` (unchanged) and only apply `not` filters.
- Else:
  - Gather candidate sets for each `has` ctor via the index; if any is missing, early-return empty.
  - Choose the smallest candidate set; iterate its nodes and filter by:
    - `world.nodes.has(node)` (multi-world isolation)
    - remaining `has` presence via `getComponent` (also collects instances)
    - `not` absence via `getComponent`
  - Yield `[node, ...componentsInOrder]`.
- Fallback: if index is not available for all `has`, either early-exit (safe) or scan; MVP will early-exit — if no set exists, there are no owners for that component.

Behavior
- Identical results to current implementation.
- Faster when the smallest `has` set is much smaller than `world.nodes` or when worlds are large.

Alternatives considered
- Per-World index service: `World` hosts `QueryIndexService` and observes component attaches/detaches via hooks.
  - Pros: avoids out-of-world nodes in the index; tighter lifecycle control.
  - Cons: requires new event wiring between component registry and world; more moving parts now.
- Bitset signatures on `Node` with per-component IDs.
  - Pros: O(1) mask checks; extremely fast join planning.
  - Cons: higher complexity, global ID management, and cross-package coupling. Defer.

Complexity & trade-offs
- Global sets include nodes that are not in a world; filtered by `world.nodes.has(node)` at query time. This is simple and correct.
- Memory overhead is proportional to number of attached components; cleaned on `Node.destroy()`.
- No public surface changes; internals remain testable and explicit.

Testing plan
- Existing query tests must pass unchanged.
- Add multi-world test: nodes with the same components in two worlds; bound queries must return only local nodes.
- Add lifecycle test: attach before adding node to a world; later add to world; index should already contain the node; query must include it only after add.
- Add destroy cleanup test: destroy a node; it must not appear in results; also ensures index removal is invoked.

Rollout plan (MVP)
1. Add `domain/ecs/queryIndex.ts` with:
   - `registerComponent(owner: Node, Ctor: ComponentCtor)`
   - `removeNode(owner: Node)`
   - `candidates(Ctor: ComponentCtor): ReadonlySet<Node> | undefined`
2. Patch `componentRegistry.setComponent` to call `registerComponent` after storing the instance.
3. Patch `Node.destroy()` to call `removeNode`.
4. Update `domain/ecs/queries.ts` to use the index when `has.length > 0`.
5. Add tests for the outlined cases.

Open questions
- Should we also expose a debug-only API to inspect index sizes for profiling? (Leaning no for now.)
- If component removal is introduced later, we must also remove from the index there.

Bench (optional, local)
- Script a synthetic world (e.g., 100k nodes, sparse component attachments) and compare query run times before/after.
- Not to be part of CI; use only for manual validation.

