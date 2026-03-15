---
id: TICKET-152
title: Reorganize src/ directory structure
status: done
epic: EPIC-026
created: 2026-03-14
priority: high
---

## Problem

The current directory structure has two main issues:

1. **`nodes/` is a flat bag of 27 files** — players, HUD, overlays, atmosphere, camera, platform, and effects are all peers with no grouping by domain.
2. **`src/` root is cluttered** — 14 loose files mixing stores, systems, UI screens, utilities, and infrastructure.
3. **`components/` has one file** — `PlayerTag.ts` doesn't justify its own directory.

## Solution

Restructure into semantic groups:

**nodes/ subdirectories:**
- `nodes/player/` — LocalPlayerNode, RemotePlayerNode, AiPlayerNode, PlayerTag, extracted mechanics
- `nodes/platform/` — PlatformNode + extracted textures/wake/shader modules
- `nodes/camera/` — CameraRigNode
- `nodes/effects/` — ShockwaveNode, ReplayNode, VictoryEffectNode, SupernovaNode, collisionEffects
- `nodes/atmosphere/` — NebulaNode, StarfieldNode, AtmosphericDustNode, EnergyPillarsNode
- `nodes/hud/` — ScoreHudNode, DashCooldownHudNode, TouchControlsNode, CountdownOverlayNode, IntroOverlayNode, KnockoutOverlayNode, MatchOverOverlayNode, PauseMenuNode, DisconnectOverlayNode

**New top-level directories:**
- `stores/` — dashCooldown, hitImpact, playerVelocity, replay, shockwave
- `ui/` — menu.tsx, lobby.tsx, overlayAnimations, lobbyHelpers
- `network/` — webrtc.ts, server.ts
- `infra/` — baseUrl, setupPostProcessing, versionCheck, versionMatch, updateAutoReload

**Deletions:**
- `components/` — empty after moving PlayerTag to `nodes/player/`

## Ordering

This ticket should be done **after** the extraction tickets (TICKET-136 through TICKET-151) so newly extracted files land in their correct locations from the start. The directory reorganization moves existing files; the extractions create new ones.

## Files

All files under `demos/arena/src/`
