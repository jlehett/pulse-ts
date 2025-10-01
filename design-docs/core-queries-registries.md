# Core: Generic Registries + Typed Queries (Design)

Status: Proposal (seeking feedback)

Goals
- Reduce duplication with a small, generic constructor-keyed registry helper.
- Introduce ergonomic, type-safe component queries that are easy to read and extend.
- Keep public surface simple and function-first; defer heavy indexing to a later, compatible iteration.

Non-goals
- No breaking changes to current public APIs.
- No optimizer/indexing in this pass; implement naive iteration over `world.nodes` first.

## 1) Generic Registry Helper

Problem
- `ServiceRegistry` and `SystemRegistry` are nearly identical. Minor differences make maintenance noisier.

Proposal
- Add `CtorRegistry<TBase>` to encapsulate constructor-keyed storage.
- Implement `ServiceRegistry` and `SystemRegistry` as thin wrappers that compose `CtorRegistry`.

Public API (internal domain)
- Location: `packages/core/src/domain/ecs/registry.ts`
- Shape:
  ```ts
  export class CtorRegistry<TBase> {
    set<T extends TBase>(instance: T): void;
    get<T extends TBase>(Ctor: new () => T | ThisParameterType<T>): T | undefined;
    remove<T extends TBase>(Ctor: new () => T | ThisParameterType<T>): void;
    values(): Iterable<TBase>;
    clear(): void;
  }
  ```
- `ServiceRegistry` and `SystemRegistry` become wrappers using a private `CtorRegistry` instance. No public behavior change.

Tests
- Keep current `ServiceRegistry`/`SystemRegistry` tests; optionally add a small unit test for `CtorRegistry` with a dummy base.

## 2) Typed Queries

Problem
- There is no ergonomic, type-safe way to iterate nodes by component presence/absence.
- Systems end up scanning `world.nodes` manually and calling `getComponent` repeatedly.

Design Principles
- Type inference for component tuples.
- Tuple result: include `Node` and component instances in predictable order.
- Naive iteration now; future optimization via indexes should be internal and non-breaking.

Proposal A (builder, preferred)
- `defineQuery` creates a reusable query object that can be run against any `World`.

Public API
- Location: `packages/core/src/domain/ecs/queries.ts` (re-export via `public/`)
- Functions:
  ```ts
  export type ComponentCtor<T extends Component = Component> = new () => T;

  export function defineQuery<const Has extends readonly ComponentCtor[],
                              const Not extends readonly ComponentCtor[] = []>(
    has: Has,
    opts?: { not?: Not }
  ):
    {
      run(world: World): IterableIterator<[
        Node,
        ...{ [K in keyof Has]: InstanceType<Has[K]> }
      ]>;
      some(world: World): boolean;
      count(world: World): number;
    };

  // Convenience sugar for one-off queries
  export function query<const Has extends readonly ComponentCtor[]>(
    world: World,
    has: Has,
    opts?: { not?: readonly ComponentCtor[] }
  ): IterableIterator<[
    Node,
    ...{ [K in keyof Has]: InstanceType<Has[K]> }
  ]>;
  ```

Examples
- Simple has-query:
  ```ts
  const Q = defineQuery([Transform, Bounds]);
  for (const [node, t, b] of Q.run(world)) {
    // ...
  }
  ```
- Has + not-query:
  ```ts
  const Visible = defineQuery([Transform, Bounds], { not: [Visibility] });
  const any = Visible.some(world);
  for (const [node, t, b] of Visible.run(world)) { /* ... */ }
  ```
- One-off query:
  ```ts
  for (const [node, t] of query(world, [Transform])) { /* ... */ }
  ```

Implementation (phase 1: naive)
- Iterate `world.nodes`; for each node ensure all `has` present via `getComponent`.
- Skip nodes if any `not` present.
- Yield typed tuple `[node, ...components]`.
- `some` returns early on first match; `count` iterates and increments.

Forward Compatibility (phase 2: indexed)
- Later, we can add internal indexes (e.g., Map<Ctor, Set<Node>>) maintained on attach/detach.
- `defineQuery` can select the smallest set as the driving set and filter others, preserving API.

Tests
- Cover has-only, has+not, zero results, and correct type tuple order.
- Ensure dynamic changes reflect in subsequent `run(world)` calls.

Docs/JSDoc
- Each public function has JSDoc with runnable examples (as above).
- Add a short guide snippet in `apps/docs/learn/core-concepts.md` (follow-up PR) after stability is proven.

## Open Questions
- Name: keep `defineQuery` + `query` or rename to `createQuery`?
- Tuple order: `[node, ...components]` vs `[...components, node]` — I propose node first for consistency with traversal helpers and easier destructuring.
- Should we add a `.forEach(world, cb)` on the query object for convenience?

## Rollout Plan
1) Implement `CtorRegistry` and refactor `ServiceRegistry`/`SystemRegistry` to use it (no public changes).
2) Implement `defineQuery` + `query` (naive iteration), tests, JSDoc.
3) Wire exports in `public/` and add brief docs.
4) Later: add internal indexes without changing the public API.

