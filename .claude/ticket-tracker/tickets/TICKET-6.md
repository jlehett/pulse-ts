---
id: TICKET-6
title: Add Playwright e2e FPS benchmark suite
status: open
priority: high
epic: EPIC-1
created: 2026-02-18
---

# TICKET-6: Add Playwright e2e FPS benchmark suite

## Problem

Per-system microbenchmarks don't capture full-stack performance (rendering, shadow maps, Three.js sync, input processing all together). We need end-to-end FPS measurements in realistic scenarios to catch regressions that only appear under real load.

## Acceptance Criteria

- [ ] Playwright test suite that launches the platformer demo via Vite dev server
- [ ] At least 3 scenario benchmarks:
  - **Idle** — player standing still, no movement (baseline render cost)
  - **Active** — player moving continuously across all platforms
  - **Stress** — maximum collectibles + physics bodies active simultaneously
- [ ] Each scenario runs for a fixed duration (e.g., 5s) and reports: mean FPS, p5 FPS (worst-frame baseline), frame time std deviation
- [ ] Results written to a JSON artifact (e.g., `bench-results/fps.json`) for comparison across runs
- [ ] CI job defined (separate from unit test job; can run nightly or pre-merge on demand)
- [ ] Documented how to run locally and interpret results

## Notes

- Measure frame times via `performance.now()` injected into the page, not Playwright's own timing
- Headless Chromium is sufficient; no GPU required for correctness (software rasterizer acceptable for relative comparisons)
- Keep scenarios deterministic — fixed spawn positions, scripted inputs rather than manual play
- This ticket depends on TICKET-2 being done first is not required, but results are most useful when TICKET-1 is also done (for before/after comparison)
