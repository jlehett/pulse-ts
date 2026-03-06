---
paths:
  - "demos/arena/src/lobby.ts"
  - "demos/arena/infra/lambda/src/index.ts"
---
# Lambda WebSocket Message Ordering Is NOT Guaranteed

## Problem

API Gateway WebSocket routes trigger **separate concurrent Lambda invocations** for each message. Two messages sent by a client in sequence (e.g., `game-start` then `signal:offer`) arrive at Lambda as independent invocations that can complete in any order.

This means the relay target receives messages in **Lambda completion order**, not client send order. A signal relay (simple DynamoDB lookup + PostToConnection) can complete faster than a game-start handler (more DynamoDB operations), causing the offer to arrive at the joiner BEFORE game-start.

## Convention: Buffer Early, Queue ICE

### Joiner: Buffer signals from lobby join, not from game-start

```typescript
// Start buffering signal messages immediately on lobby join
const signalBuffer: MessageEvent[] = [];
ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.type === 'signal') signalBuffer.push(ev);
});

// Later, when game-start arrives, pass the full buffer to establishP2P
```

### ICE candidates: Queue until remote description is set

ICE candidates arriving before the offer/answer MUST be queued and flushed after `setRemoteDescription` succeeds. Calling `addIceCandidate` before the remote description is set throws "The remote description was null".

```typescript
const pendingIce: RTCIceCandidate[] = [];
let remoteDescSet = false;

// On offer/answer: setRemoteDescription → flush pending ICE
// On ICE: if remoteDescSet → addIceCandidate, else → queue
```

## Why This Is Non-Obvious

- WebSocket.send() guarantees client-side ordering
- API Gateway preserves message ordering to Lambda
- But Lambda invocations are **concurrent** — completion order varies
- The race only manifests when one handler is slower than another (e.g., game-start does more DB work than signal relay)
