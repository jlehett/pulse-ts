---
id: EPIC-005
title: Audio Package
status: todo
created: 2026-02-26
updated: 2026-02-26
---

## Description

Create a new `@pulse-ts/audio` package providing AudioContext lifecycle management, declarative procedural sound synthesis, and optional spatial (3D positional) audio. Replaces the demo-local `audio.ts` utility with a proper engine-level solution.

## Goal

Enable any pulse-ts game to define and play sounds with a declarative `useSound()` hook — no direct Web Audio API manipulation needed. AudioContext lifecycle (lazy creation, autoplay policy, suspend/resume) handled automatically.

## Notes

- **2026-02-26**: Epic created. The platformer demo's `audio.ts` proves the pattern works. A proper package would provide `installAudio()` bootstrapping, `useSound()` for procedural synthesis, and optionally `useSpatialSound()` for 3D positional audio.
