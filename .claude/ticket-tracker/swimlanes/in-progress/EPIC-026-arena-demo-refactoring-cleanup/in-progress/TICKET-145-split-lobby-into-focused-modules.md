---
id: TICKET-145
title: Split lobby.tsx into focused modules
status: in-progress
epic: EPIC-026
created: 2026-03-14
updated: 2026-03-14
priority: high
branch: ticket-145-split-lobby-into-focused-modules
---

## Problem

At 1058 lines, `lobby.tsx` contains mixed concerns:
- WebRTC handshake logic (`establishP2P`, `requestIceServers`, ICE server config)
- Signaling URL builder (`getSignalingUrl`)
- 7 screen functions (`showLobbyMenu`, `showUsernamePrompt`, `showHostSetup`, `showHostWaiting`, `showJoinBrowser`, `showJoinWaiting`, `showVersionMismatch`)
- Username persistence (`getUsername`, `setUsername`, `hasUsername`)
- Shared UI helpers (`createOverlay`, `clearAndCreateContent`, `createHeading`, `createSubheading`, `createBtn`, `createColumnEl`, `createRowEl`, `createStatusIndicator`)

## Solution

Extract into focused modules:
- **`network/webrtc.ts`** — `establishP2P`, `requestIceServers`, ICE server config, signaling URL builder
- **Username utility** — `getUsername`, `setUsername`, `hasUsername`, `USERNAME_KEY`, `USERNAME_MAX_LENGTH`
- **`ui/lobbyHelpers.ts`** — shared DOM helpers (`createOverlay`, `clearAndCreateContent`, `createHeading`, `createBtn`, etc.) or merge with `overlayAnimations.ts`

The lobby screens remain but become much shorter, focused on screen flow logic.

## Files

- `demos/arena/src/lobby.tsx`

## Notes

- **2026-03-14**: Starting implementation
