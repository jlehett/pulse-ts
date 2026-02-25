---
id: TICKET-008
epic: EPIC-001
title: Add batch variants to existing benchmarks and rename to *.bench.test.ts
status: in-progress
priority: medium
branch: ticket-008-add-batch-variants-to-existing-benchmarks
created: 2026-02-25
updated: 2026-02-25
---

## Description

Two related improvements to the existing per-package benchmark files:

### 1. Rename *.bench.ts → *.bench.test.ts

All benchmark files currently use the `.bench.ts` extension. Renaming to `.bench.test.ts` ensures that IDEs, TypeScript tooling, and vitest all recognize them as test files. The `include` globs in each package's `vitest.config.ts` must be updated to match.

Files to rename:
- `packages/core/src/domain/components/spatial/transform.bench.ts` → `transform.bench.test.ts`
- `packages/core/src/domain/ecs/query/query.bench.ts` → `query.bench.test.ts`
- `packages/physics/src/domain/services/physicsStep.bench.ts` → `physicsStep.bench.test.ts`

Config globs to update:
- `packages/core/vitest.config.ts` — `include: ['src/**/*.bench.ts']` → `src/**/*.bench.test.ts`
- `packages/physics/vitest.config.ts` — same

### 2. Add batch variants to transform.bench.test.ts

Single-operation benchmarks (`flatT.localPosition.x = 1.0`) run sub-microsecond, hiding the real cost when the same operation runs across N entities per frame. Add loop benchmarks that simulate realistic per-frame usage at entity counts that mirror real scenes.

Suggested additions to `transform.bench.test.ts`:
- **Property mutation — N entities**: loop over 100 and 1,000 pre-built nodes, writing `localPosition.x` and calling `setLocal()` on each (simulates a system updating all moving entities per frame)
- **getWorldTRS — dirty chain — N entities**: dirty and recompute for 100 and 1,000 nodes with a 4-level hierarchy

The 1k-entity variants will make the Proxy overhead visible as a real aggregate cost, giving TICKET-003 a meaningful before/after signal.

## Acceptance Criteria

- [ ] All three bench files renamed to `*.bench.test.ts`
- [ ] `include` globs in both `vitest.config.ts` files updated
- [ ] `npm run bench` at root still runs all benchmarks successfully
- [ ] `transform.bench.test.ts` has batch variants at 100 and 1,000 entities for property mutation and dirty-recompute
- [ ] Baseline numbers for new batch variants appended to `BENCHMARKS.md`
- [ ] All new bench cases have JSDoc explaining what they measure

## Notes

- **2026-02-25**: Ticket created. Single-op benchmarks run sub-microsecond and make the Proxy cost appear negligible; batch variants are needed to surface the real aggregate cost before TICKET-003 lands.
