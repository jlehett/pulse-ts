---
id: TICKET-002
epic: EPIC-001
title: Set up automated benchmark tracking
status: todo
priority: high
created: 2026-02-24
updated: 2026-02-24
---

## Description

Establish a repeatable workflow for running the existing `.bench.ts` files and capturing baseline numbers before any optimization work begins. Defines the "before" state that all subsequent optimization tickets will measure against.

Benchmarks already exist:
- `packages/core/src/domain/components/spatial/transform.bench.ts` — Transform Proxy cost
- `packages/physics/src/domain/services/physicsStep.bench.ts` — Physics step with 10/50/100 bodies

There is currently no standard command or CI step to run them and record output.

## Acceptance Criteria

- [ ] A consistent command exists to run all benchmarks (e.g., `npm run bench` at root or per-package)
- [ ] Baseline numbers are recorded (in a `BENCHMARKS.md` or similar) before optimization begins
- [ ] Running benchmarks after changes makes it easy to compare against baseline

## Notes

- **2026-02-24**: Ticket created. Blocks TICKET-003, TICKET-004, TICKET-005, TICKET-006. Can be done in parallel with TICKET-001.
