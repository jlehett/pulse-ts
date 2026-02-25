---
id: TICKET-009
epic: EPIC-001
title: Create benchmarks/ package with cross-package integration benchmarks
status: todo
priority: medium
created: 2026-02-25
updated: 2026-02-25
---

## Description

Create a top-level `benchmarks/` workspace package that houses integration benchmarks spanning multiple packages. This avoids the alias hacks currently needed in the physics package's vitest config and provides a natural home for full-engine scenarios that can't be tested in isolation.

### Package setup

- `benchmarks/package.json` — workspace package (e.g. `@pulse-ts/benchmarks`), `devDependencies` on `@pulse-ts/core`, `@pulse-ts/physics`; `scripts.bench: vitest bench --run`
- `benchmarks/vitest.config.ts` — resolves workspace packages from source (or built output), `include: ['**/*.bench.test.ts']`
- Root `package.json` Nx/npm workspaces config already picks up new packages automatically; verify `npm run bench` at root includes the new package

### Cross-package integration benchmarks

Add at least one `*.bench.test.ts` file covering a realistic full-frame game loop:

**`benchmarks/gameLoop.bench.test.ts`** — simulates what the engine does every frame:
1. Run ECS query (`defineQuery([Transform, RigidBody])`) over the world
2. Call `physics.step(dt)` — includes broad-phase, narrow-phase, constraint solving
3. Read back `getWorldTRS()` on every entity (simulates a render system consuming results)

Run at several body counts: 50, 100, 250, 500 (if runtime allows). These scales expose costs that are invisible in per-package microbenchmarks and give a realistic performance ceiling to track across the optimization tickets.

## Acceptance Criteria

- [ ] `benchmarks/` directory exists as a proper npm workspace package
- [ ] `benchmarks/vitest.config.ts` resolves `@pulse-ts/core` and `@pulse-ts/physics` from source without manual alias hacks
- [ ] At least one `*.bench.test.ts` file with a full game-loop integration benchmark (ECS query + physics step + world TRS read)
- [ ] Benchmarks run at 50, 100, 250, and 500 body counts
- [ ] `npm run bench` at root includes the new benchmarks package
- [ ] Baseline numbers appended to `BENCHMARKS.md`
- [ ] All bench cases have JSDoc explaining what they measure

## Notes

- **2026-02-25**: Ticket created. Physics package already imports from @pulse-ts/core via an alias workaround; a proper benchmarks package eliminates this and scales cleanly as more packages are added.
- **2026-02-25**: Blocked by TICKET-008 — naming convention (*.bench.test.ts) should be established before new package is created.
