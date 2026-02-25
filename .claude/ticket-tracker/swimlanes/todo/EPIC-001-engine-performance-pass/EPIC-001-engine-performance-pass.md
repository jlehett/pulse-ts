---
id: EPIC-001
title: Engine Performance Pass
status: todo
created: 2026-02-24
updated: 2026-02-24
---

## Description

Eliminate the main CPU and GC bottlenecks causing lag in the platformer demo. Covers observability tooling, allocation reduction, and GPU cost tuning.

## Goal

Achieve a stable 60fps in the platformer demo by removing the Transform Proxy, pooling short-lived Vec3/Quat allocations, fixing broad-phase fallback, reducing shadow map cost, and establishing benchmark baselines to verify every improvement.

## Notes

- **2026-02-24**: Epic created. Migrated from old flat-file format to swimlane structure.
