# @pulse-ts/network – Refactor Proposal (Ergonomics, Tests, Docs)

Status: Draft for review
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

