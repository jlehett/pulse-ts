---
id: EPIC-025
title: Arena Demo Engine Migration
status: in-progress
created: 2026-03-13
updated: 2026-03-14
---

## Description

Refactor the bumper balls arena demo to utilize all new engine improvements from
EPIC-018 through EPIC-024. Replace manual boilerplate with the new hooks, utilities,
and packages. This epic validates the new engine APIs against a real codebase and
serves as the reference implementation for documentation examples.

## Goal

The arena demo is clean, concise, and idiomatic — using engine primitives instead of
manual patterns. Every applicable engine improvement is adopted. The demo serves as
a showcase of pulse-ts DX.

## Notes

- **2026-03-13**: Epic created. Depends on completion of EPIC-018 through EPIC-024. Tickets cover core, three.js, DOM, effects, input/platform, network, and audio/physics migrations.
- **2026-03-14**: Epic implementation started via agent team
