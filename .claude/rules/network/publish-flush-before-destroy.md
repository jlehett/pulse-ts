# Flush Network Outbox Before World Destruction

**Paths:** `packages/network/src/domain/services/TransportService.ts`, `demos/arena/src/nodes/MatchOverOverlayNode.ts`

## The Problem

`TransportService.publish()` does NOT send messages immediately. It queues them to an internal **outbox** that is flushed by `NetworkTick` on the next game loop tick via `flushOutgoing()`.

If code publishes a channel message and then **synchronously destroys the world** (e.g., `world.destroy()` via a rematch/menu callback), the `NetworkTick` never runs again and the outbox is never flushed. The message is silently lost.

## The Bug Pattern

```typescript
// BROKEN: accept message is queued but never sent
rematchBtn.addEventListener('click', () => {
    ch.publish({ type: 'accept' });      // queued in outbox
    props.onRequestRematch?.();           // destroys world synchronously
    // NetworkTick never runs → outbox never flushed → message lost
});
```

The remote peer never receives the accept and stays stuck waiting.

## The Fix

Manually flush the outbox after publishing, before any world-destroying callback:

```typescript
const world = useWorld();
const flushNet = () =>
    world.getService(TransportService)?.flushOutgoing();

rematchBtn.addEventListener('click', () => {
    ch.publish({ type: 'accept' });
    flushNet();                           // forces outbox → DataChannel
    props.onRequestRematch?.();           // safe to destroy now
});
```

## When This Applies

Any code path where:
1. A channel message is published via `ch.publish()` or `svc.publish()`
2. The world is destroyed synchronously afterward (rematch, menu return, disconnect)

This includes click handlers, channel message handlers that trigger world teardown, and any callback that leads to `world.destroy()`.

## Why It's Hard to Debug

- No errors or warnings — the message is silently dropped
- The publishing side appears to work (button state changes, world restarts)
- Only the receiving side is affected (stuck waiting for a message that was never sent)
- The outbox queuing is an internal implementation detail not visible from the `useChannel` API
