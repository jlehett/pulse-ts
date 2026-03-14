---
id: EPIC-024
title: Audio & Physics DX Pass
status: todo
created: 2026-03-13
updated: 2026-03-13
---

## Description

Add audio mixing groups to `@pulse-ts/audio` for independent volume control per sound
category. Add collision filter options to `@pulse-ts/physics` for declarative collision
callback filtering.

## Goal

Players can adjust SFX vs music volume independently. Collision callbacks skip irrelevant
events declaratively instead of manual guard checks.

## Notes

- **2026-03-13**: Epic created from approved engine improvements (#36, #40). Two tickets.
