---
id: TICKET-2
title: Add Vitest per-system microbenchmarks
status: in-progress
priority: high
epic: EPIC-1
created: 2026-02-18
---

# TICKET-2: Add Vitest per-system microbenchmarks

## Problem

There are no automated performance tests for engine hot paths. Regressions in ECS queries, transform recomputation, and physics stepping go undetected until someone notices the demo feeling slow.

## Acceptance Criteria

- [ ] Vitest `bench` covering ECS query iteration at varying entity counts (100, 1k, 10k)
- [ ] Vitest `bench` covering Transform dirty-mark + world matrix recompute cycle
- [ ] Vitest `bench` covering a full physics step with N dynamic bodies (10, 50, 100)
- [ ] All benchmarks run headless in Node — no browser, no canvas required
- [ ] Bench files colocated with the code they measure (e.g., `query.bench.ts`)
- [ ] Inline comments explain what each benchmark measures and why

## Notes

- Use Vitest's `bench` API; avoid custom timing harnesses
- Benchmarks must be deterministic — fixed entity counts, no random layouts
- These run on every CI pass; keep them fast (target < 30s total)
- The Transform bench is specifically useful as a before/after harness for TICKET-1

## Notes Log

- 2026-02-18: Starting implementation
