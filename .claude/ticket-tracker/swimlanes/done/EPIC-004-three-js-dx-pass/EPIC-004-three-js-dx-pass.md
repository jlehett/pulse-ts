---
id: EPIC-004
title: Three.js DX Pass
status: done
created: 2026-02-26
updated: 2026-02-26
---

## Description

Reduce Three.js boilerplate in `@pulse-ts/three` by adding higher-level hooks for mesh creation, camera rigs, and lighting setup. Every visual node in the platformer demo repeats the same 5-line geometry→material→mesh→shadow→useObject3D pattern.

## Goal

Provide `useMesh()`, `useFollowCamera()`, and lighting helpers (`useAmbientLight`, `useDirectionalLight`, `useFog`) so that common Three.js setup is a single declarative call with auto-cleanup.

## Notes

- **2026-02-26**: Epic created. Identified from platformer demo — every visual node (PlatformNode, CollectibleNode, EnemyNode, HazardNode, CheckpointNode, GoalNode) repeats identical mesh setup boilerplate. CameraRigNode is 70+ lines of manual follow/lerp/shake logic.
- **2026-02-26**: Epic closed. All 3 tickets complete: useMesh (TICKET-028), useFollowCamera (TICKET-029), lighting/fog helpers (TICKET-030).
