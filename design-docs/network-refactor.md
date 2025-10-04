# @pulse-ts/network — Refactor Proposal (M1)

Purpose
- Make the networking package easier to understand, maintain, and extend.
- Establish clear layering, small public APIs, and comprehensive tests/docs.

Non-Goals
- No feature additions beyond minor ergonomics and docs.
- Avoid breaking exported API names in this first pass.

Current State (summary)
- Public surface is centralized in `src/index.ts` and already fairly small.
- Good separation of concerns: transports, messaging, services, systems, server helpers, FC hooks.
- Tests are missing for this package (no `*.test.ts`).
- JSDoc coverage is present but examples/param annotations are inconsistent.
- Directory layout does not follow the repo-wide public/domain/infra/utils convention.

Problems
- Harder to discover what is “public vs. internal” inside the package.
- No automated tests -> risk of regressions.
- Some public items lack runnable examples in JSDoc.

Goals and Outcomes
- Clear layering and file organization.
- Add a focused set of deterministic unit tests to cover core behavior.
- Ensure public APIs have JSDoc with params/returns and minimal runnable examples.
- No breaking changes to exported names in this pass (keep imports stable).

Proposed Module Layout

```
packages/network/
  src/
    public/        # Public APIs: hooks, install, facade, dsl helpers, index barrel
    domain/        # Reusable logic/services/systems/replication/messaging
    infra/         # Platform adapters: transports/, server/
    utils/         # Small pure helpers (if needed)
```

Mapping (no API changes; internal import paths will change):
- public
  - `fc/*.ts` -> `public/` (rename files to concise names, e.g., `hooks.ts`, `transform.ts`)
  - `install.ts`, `facade.ts`, channel DSL helpers (defineChannel, channel)
  - `index.ts` remains as the only export barrel
- domain
  - `services/*`, `systems/*`, `replication/protocol.ts`, `messaging/*`
- infra
  - `transports/*`, `server/*`

Test Plan (initial pass)
- messaging
  - JSON codec encode/decode roundtrip
  - channel helpers: defineChannel, channelKey, once()
- transports
  - MemoryTransport sends/receives via MemoryHub
- services
  - TransportService publish/subscribe, addressed packets, stats, events (basic)
  - RpcService call/register across two worlds via MemoryHub
  - ReliableChannelService request/ack across two worlds (happy path)
  - ReplicationService read/apply delta across two worlds
- server (pure helpers)
  - packets encode/decode
  - rooms: join/leave ack/err
  - rateLimit: buckets and per-channel override logic
  - routing: validate/onMessage/route flow

Documentation Plan
- Strengthen JSDoc on public functions and classes with minimal runnable examples:
  - `installNetwork`, `getNetwork`, `useConnection`, `useWebSocket`, `useMemory`, `useWebRTC`
  - `useChannel`, `useChannelTo`, `useRPC`, `useRPCTo`, `useReliable`, `useReliableTo`, `useRoom`, `useReplication`, `useReplicateTransform`, `useClockSync`
  - Services: TransportService, RpcService, ReliableChannelService, ReplicationService, InterpolationService (class-level examples)
- Ensure existing VitePress guide pages remain accurate; no API renames in this pass.

Phased Execution
1) Add tests and JSDoc examples (no API/structure changes).
2) Low-risk cleanups (remove unused imports, minor consistency fixes, unify encode path in server.unicast).
3) Submit directory restructuring as a follow-up once approved (mechanical moves + fixed internal imports; index re-exports preserved).

Open Questions
- Do we want to split `index.ts` into `src/public/index.ts` now and keep a pass-through `src/index.ts`? (Would be non-breaking but large diff.)
- Should `WebSocketTransport` adopt `encodePacket` for consistency on the server side examples in docs? (Client transport operates on bytes; keeping codec boundary in TransportService seems clearer.)

Approval Request
- If this plan looks good, I’ll proceed with Phase 1 (tests + JSDoc examples) and the small cleanups in Phase 2. Then I’ll propose the directory move as a dedicated patch to keep the PR easy to review.

