# @pulse-ts/network – Refactor Proposal (Ergonomics, Tests, Docs)

Status: In progress
Owner: Codex
Scope: packages/network (public API, tests, docs)

## Goals
- Make public-facing APIs more ergonomic and function‑first without breaking existing deep imports.
- Close key test gaps (transport behavior, clock sync, signaling) to keep changes safe and future‑proof.
- Tighten documentation (JSDoc + guides) to mirror public API usage and examples.
- Preserve the existing layered architecture and keep implementation details private.

## Non‑Goals
- Major protocol changes (channels/RPC/reliable/replication) or broad server redesign.
- Implementing advanced WebRTC features (TURN mgmt, perfect negotiation) beyond the current minimal mesh.

## Current Snapshot (Summary)
- Clean layered structure (public, domain, infra) with solid tests for core services, replication, server broker, and memory transport.
- Public APIs are mostly hooks + a facade and installer; transports are class‑based and exposed via deep imports (e.g., `@pulse-ts/network/transports/websocket`).
- Docs are comprehensive, already showcasing channels, RPC, reliable, replication, transports, broker.

## Issues / Opportunities
- Public API guidance prefers function‑first. Users currently construct classes for transports. This is fine, but a tiny factory layer improves ergonomics and communicates the intended surface (a `Transport`).
- A few behavioral areas lack direct, isolated tests:
  - WebSocketTransport (status transitions, message normalization, optional auto‑reconnect)
  - ClockSyncService (best‑RTT sample logic and offset)
  - RtcSignalingClient (addressing and subscription filtering)

## Proposal
1) Add small, typed factory helpers that return `Transport`:
   - `createWebSocketTransport(url, opts?)` → wraps `new WebSocketTransport(...)`
   - `createMemoryTransport(hub, opts?)` → wraps `new MemoryTransport(...)`
   - `createWebRtcMeshTransport(selfId, opts)` → wraps `new WebRtcMeshTransport(...)`

   Rationale: exposes function‑first entry points while keeping class deep‑imports for advanced users. No behavior change.

2) Tests: add focused unit tests
   - `WebSocketTransport` with a fake WebSocket ctor to verify:
     - `connect()` sets status, `onMessage` normalization (string/ArrayBuffer/View), `send()` works, and `disconnect()` updates status.
     - Smoke coverage for `autoReconnect` scheduling (without relying on real timers for long periods).
   - `ClockSyncService` best‑RTT sample picks the smallest RTT and applies corresponding offset.
   - `RtcSignalingClient` only forwards messages addressed to `selfId` and publishes via reserved channel.

3) Documentation updates
   - Add factory usage snippets in the transports guides alongside the existing class examples (non‑breaking, additive).
   - Ensure JSDoc on new factories includes succinct runnable examples.

## Public API Impact
- Add new exports from `@pulse-ts/network` root:
  - `createWebSocketTransport`, `createMemoryTransport`, `createWebRtcMeshTransport`
- No removals; existing deep imports and examples continue to work.

## Risks
- Minimal: factories are thin wrappers over existing classes; tests target behavior already present.

## Rollout Plan
- Implement factories and tests in the `network` package.
- Update docs (guides) to show the factory pattern as the recommended default, keeping class examples intact.
- Run `npm test -w packages/network --silent` and `npm lint:fix -w packages/network` before PR.

## Open Questions
- Do we want a top‑level `useWebSocket(createWebSocketTransport(url))` example in docs, or keep `useWebSocket(url)` as the most compact path? (Proposal: keep current hook ergonomics; factories are most helpful for imperative `getNetwork(world).connect()` usage.)
- Should we add a `P2PTransport` interface extension later (optional) to formalize peer lifecycle? For now, `Transport` has optional hooks and `peers()`, which is sufficient.

---

## Directory Structure Reorg (Discoverability)

Goal: reduce visual flatness and improve code discovery by grouping server and transport internals under meaningful subfolders, while keeping the public surface unchanged. We will prefer deeper, focused directories.

Proposed layout (only showing `packages/network/src`):

```
public/
  hooks.ts
  transform.ts
  install.ts
  facade.ts
  factories.ts

domain/
  types.ts
  messaging/
    channel.ts
    codec.ts
    *.test.ts
  replication/
    protocol.ts
    *.test.ts
  services/
    TransportService.ts
    RpcService.ts
    ReliableChannel.ts
    ReplicationService.ts
    ClockSyncService.ts
    InterpolationService.ts
    *.test.ts
  systems/
    NetworkTick.ts
    SnapshotSystem.ts
    InterpolationSystem.ts

infra/
  transports/
    memory/
      hub.ts
      transport.ts
      index.ts
      memory.test.ts
    websocket/
      transport.ts
      index.ts
      transport.test.ts
    webrtc/
      transport.ts
      index.ts
  signaling/
    RtcSignalingClient.ts
    RtcSignalingClient.test.ts
  server/
    core/
      NetworkServer.ts    (from broker.ts)
      attachWsServer.ts   (from ws.ts)
    routing/
      channels.ts
      routing.ts
      validate.ts
    io/
      packets.ts
    peers/
      peers.ts
    features/
      rooms.ts
      rpc.ts
      reliable.ts
      rateLimit.ts
    *.test.ts (updated imports)

transports/ (deep-import barrels stay)
  websocket/index.ts
  webrtc/index.ts
  memory/index.ts

index.ts (root exports)
```

Public API: unchanged symbols. `index.ts` continues to export the same named symbols; only internal paths change. We can keep small re-export stubs in old locations for a transitional period if desired.

Implementation plan:
- Move files per the map above.
- Update all internal imports and test imports.
- Update `index.ts` server exports to new paths.
- Optionally leave thin re-exports (deprecated) in `infra/server/*.ts` pointing to the new locations to ease review.
- Run package tests and lint.

Pros:
- Clear topical grouping (core vs routing vs features) for server code.
- Transports are self-contained; tests colocated.
- Domain layer remains focused with services/messaging/replication/systems.

Risks / Mitigations:
- Large diff from file moves; mitigated by re-export stubs and thorough tests.

Request for approval:
- Confirm the proposed folder names and the `NetworkServer.ts`/`attachWsServer.ts` renames.
- If approved, I’ll implement the moves, update imports, and keep re-export stubs for a smooth transition.

## Implementation Status (current)

- ✅ Factories + docs landed (`createWebSocketTransport`, etc.).
- ✅ Targeted tests cover WebSocket transport, ClockSyncService RTT sampling, and the RTC signaling client.
- ✅ Server directory reorg implemented with `core/`, `features/`, `routing/`, `io/`, and `peers/` folders; legacy entry points have been removed in favor of the new structure, and tests now live beside their respective modules.
- ⏭ Next: regenerate API docs / typedoc artifacts once review wraps, then prep release notes.
