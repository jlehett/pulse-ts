# Pulse-TS Benchmark Baselines

Captured on **2026-02-25** before any optimization work (EPIC-001).
Machine: Apple Silicon (darwin). Vitest v4.0.18.

Run command: `npm run bench`

> All times are in **µs** (microseconds) unless otherwise noted.
> **hz** = operations per second; higher is better.
> **rme** = relative margin of error.

---

## @pulse-ts/core

### Transform — property mutation (Proxy overhead)

_Target of TICKET-003 (Remove Transform Proxy)._
File: `packages/core/src/domain/components/spatial/transform.bench.test.ts`

| Benchmark | hz | mean (µs) | p75 (µs) | p99 (µs) | rme |
|---|---|---|---|---|---|
| `localPosition.x = value` | 9,927,409 | 0.0001 | 0.0001 | 0.0001 | ±0.33% |
| `localPosition.set(x, y, z)` | 5,030,004 | 0.0002 | 0.0002 | 0.0003 | ±0.07% |
| `localRotation.w = value` | 10,524,193 | 0.0001 | 0.0001 | 0.0001 | ±0.13% |
| `setLocal({ position })` | 1,641,160 | 0.0006 | 0.0006 | 0.0007 | ±0.07% |

### Transform — property mutation, batch (Proxy overhead at scale)

_Batch variants added by TICKET-008. Loop over N entities per iteration to surface aggregate frame cost._
_Use these for before/after comparison on TICKET-003._

| Benchmark | hz | mean (µs) | p75 (µs) | p99 (µs) | rme |
|---|---|---|---|---|---|
| `localPosition.x = value` — 100 entities | 230,244 | 0.0043 | 0.0043 | 0.0047 | ±1.13% |
| `localPosition.x = value` — 1,000 entities | 17,736 | 0.0564 | 0.0573 | 0.0609 | ±0.71% |
| `setLocal({ position })` — 100 entities | 19,523 | 0.0512 | 0.0514 | 0.0543 | ±0.28% |
| `setLocal({ position })` — 1,000 entities | 1,906 | 0.5247 | 0.5270 | 0.6108 | ±0.30% |

### Transform — getWorldTRS, flat node

| Benchmark | hz | mean (µs) | p75 (µs) | p99 (µs) | rme |
|---|---|---|---|---|---|
| dirty recompute (mutation before each call) | 1,657,913 | 0.0006 | 0.0006 | 0.0007 | ±0.59% |
| cache hit (no mutation) | 3,223,645 | 0.0003 | 0.0003 | 0.0004 | ±0.05% |

### Transform — getWorldTRS, 4-level hierarchy

| Benchmark | hz | mean (µs) | p75 (µs) | p99 (µs) | rme |
|---|---|---|---|---|---|
| dirty recompute (root mutation propagates to leaf) | 1,758,345 | 0.0006 | 0.0006 | 0.0007 | ±0.40% |
| cache hit (no mutation) | 2,842,672 | 0.0004 | 0.0003 | 0.0004 | ±0.96% |

### Transform — dirty recompute, batch (flat nodes)

_Batch variants added by TICKET-008. Simulates a render system reading world positions for N entities mutated this frame._
_Use these for before/after comparison on TICKET-003._

| Benchmark | hz | mean (µs) | p75 (µs) | p99 (µs) | rme |
|---|---|---|---|---|---|
| mutate + recompute — 100 entities | 19,076 | 0.0524 | 0.0518 | 0.0575 | ±1.05% |
| mutate + recompute — 1,000 entities | 1,950 | 0.5127 | 0.5011 | 0.9211 | ±1.00% |

### ECS Query — single component (Transform)

File: `packages/core/src/domain/ecs/query/query.bench.test.ts`

| Benchmark | hz | mean (µs) | p75 (µs) | p99 (µs) | rme |
|---|---|---|---|---|---|
| 100 entities | 3,277 | 0.3052 | 0.3015 | 0.5811 | ±0.89% |
| 1,000 entities | 2,502 | 0.3998 | 0.3917 | 0.7162 | ±1.00% |
| 10,000 entities | 682 | 1.4667 | 1.5931 | 2.2787 | ±1.64% |

### ECS Query — two components (Transform + Bounds)

| Benchmark | hz | mean (µs) | p75 (µs) | p99 (µs) | rme |
|---|---|---|---|---|---|
| 100 entities | 6,381 | 0.1567 | 0.1553 | 0.3909 | ±0.71% |
| 1,000 entities | 4,608 | 0.2170 | 0.2135 | 0.4825 | ±0.90% |
| 10,000 entities | 1,075 | 0.9301 | 1.0082 | 1.7661 | ±1.80% |

---

## @pulse-ts/physics

### Physics step — dynamic sphere bodies + ground plane

_Target of TICKET-004, TICKET-005, TICKET-006._
File: `packages/physics/src/domain/services/physicsStep.bench.test.ts`

> Times are in **ms** (milliseconds). Scene: N dynamic sphere bodies above a static ground plane.

| Benchmark | hz | mean (ms) | p75 (ms) | p99 (ms) | rme |
|---|---|---|---|---|---|
| step — 10 bodies | 3,607 | 0.2773 | 0.2548 | 0.7947 | ±2.59% |
| step — 50 bodies | 318 | 3.1490 | 3.2681 | 4.2117 | ±1.42% |
| step — 100 bodies | 123 | 8.1139 | 9.5877 | 10.7551 | ±5.90% |

---

## @pulse-ts/benchmarks (cross-package integration)

### Game loop — ECS query + physics step + world TRS read

_Added by TICKET-009. Simulates a full engine frame: ECS query → physics step → world matrix reads._
_Use these to track end-to-end regression across all optimization tickets in EPIC-001._
File: `benchmarks/gameLoop.bench.test.ts`

> Times are in **ms** (milliseconds).
> Scenes are pre-settled via a warm-up pass before benchmarking begins, so numbers
> reflect steady-state cost with all bodies at rest rather than mid-freefall cost.

| Benchmark | hz | mean (ms) | p75 (ms) | p99 (ms) | rme |
|---|---|---|---|---|---|
| 50 bodies | 300 | 3.337 | 3.552 | 3.984 | ±1.44% |
| 100 bodies | 88 | 11.327 | 11.774 | 13.370 | ±1.80% |
| 250 bodies | 27 | 36.433 | 37.285 | 38.745 | ±2.20% |
| 500 bodies | 11 | 91.643 | 95.514 | 97.933 | ±3.83% |

---

## How to Compare

After making changes, run `npm run bench` and compare hz and mean columns to the tables above.
A meaningful improvement is generally **>10% change in hz** with rme well below the difference.
