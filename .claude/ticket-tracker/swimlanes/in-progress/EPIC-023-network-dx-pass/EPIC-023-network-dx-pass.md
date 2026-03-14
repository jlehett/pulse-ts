---
id: EPIC-023
title: Network DX Pass
status: in-progress
created: 2026-03-13
updated: 2026-03-14
---

## Description

Enhance `@pulse-ts/network` with automatic message flush on world destroy and a
one-liner network entity setup hook that combines stable ID, transform replication,
and interpolation data access.

## Goal

Network entity setup is a single hook call instead of 3-4 separate hooks. Pending
messages are never lost on world teardown.

## Notes

- **2026-03-13**: Epic created from approved engine improvements (#9, #29). Two tickets.
- **2026-03-14**: Epic implementation started via agent team
