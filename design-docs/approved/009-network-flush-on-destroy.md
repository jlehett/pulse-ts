# Approved: Network Auto-Flush on World Destroy

> Prevent lost network messages when a world is destroyed immediately after publishing.

**Origin:** Engine Improvements #9 (Lifecycle-Aware Network Channels), Option B.

---

## Summary

Add a `useDestroy` hook inside the network installer (`installNetwork`) that flushes all pending outbound messages when the world is destroyed. This is a transparent fix — no API changes, no new options, no consumer-side code changes.

---

## Problem

When a node publishes a network message and immediately destroys the world (e.g., rematch accept, menu exit), the message is lost. `publish()` queues to an outbox that is flushed by `NetworkTick` on the next tick — but the world is destroyed before that tick runs. The current workaround is a manual `flushNet()` helper called after every publish, repeated 5+ times across the arena demo. Forgetting to flush causes silent message loss.

---

## Fix

In `installNetwork` (or the network tick system setup), register a destroy hook:

```typescript
useDestroy(() => {
    transportService.flushOutgoing();
});
```

This ensures all queued messages are sent before the transport is torn down. No consumer-side changes needed — existing `publish()` calls just work, even when followed by immediate world destruction.

---

## Design Decisions

- **Option B chosen over Option A** — A per-channel `flushOnPublish` flag (Option A) would still require opt-in at each call site and is easy to forget. Auto-flushing on destroy is the correct default — there's no scenario where you'd want to silently discard queued messages on world teardown.
- **No API surface change** — This is a behavioral fix internal to the network package. No new options, no new hooks, no breaking changes.
