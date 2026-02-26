---
id: EPIC-006
title: Effects Package
status: todo
created: 2026-02-26
updated: 2026-02-26
---

## Description

Create a new `@pulse-ts/effects` package providing a general-purpose particle system and animated value primitives. Extracts and generalizes patterns from the platformer demo (ParticleBurstNode, spin/bob/pulse animations).

## Goal

Provide `useParticles()` with callback-driven per-particle init/update for maximum flexibility, and `useAnimate()` as a general-purpose time-varying value source (oscillation, linear rate, one-shot tweens with easing).

## Notes

- **2026-02-26**: Epic created. Particle system uses Option A (callback-driven) for maximum extensibility. Animation system returns values rather than setting properties directly, keeping it renderer-agnostic.
