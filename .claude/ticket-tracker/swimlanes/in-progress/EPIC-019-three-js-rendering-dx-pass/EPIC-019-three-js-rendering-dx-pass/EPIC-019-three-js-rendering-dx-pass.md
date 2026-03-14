---
id: EPIC-019
title: Three.js Rendering DX Pass
status: todo
created: 2026-03-13
updated: 2026-03-13
---

## Description

Enhance `@pulse-ts/three` with new hooks and utilities for screen projection, position
interpolation, extended mesh materials, custom geometry, and procedural textures.
Eliminates the need to bypass `useMesh` or drop to raw `useObject3D` for common rendering tasks.

## Goal

The Three.js package covers the full spectrum from simple primitives to custom geometry
and procedural textures. Users almost never need to manually manage Three.js lifecycle
or bypass engine hooks.

## Notes

- **2026-03-13**: Epic created from approved engine improvements (#7, #25, #33, #38, #41). Five tickets.
