# Guide: Networking: RPC & Reliable Channels

Call methods across peers with `useRPC` and send request/ack messages with `useReliable`.

## Setup (memory transport demo)

```ts
import { World, useFrameUpdate, useInit } from '@pulse-ts/core';
import { useConnection, useChannel } from '@pulse-ts/network/fc/hooks';
import { createMemoryHub, MemoryTransport } from '@pulse-ts/network/transports/memory';

const hub = createMemoryHub();

function ConnectA() { useConnection(() => new MemoryTransport(hub)); }
function ConnectB() { useConnection(() => new MemoryTransport(hub)); }
```

## RPC: register and call

```ts
import { useRPC } from '@pulse-ts/network/fc/hooks';

// On peer A: register handler
function TimeService() {
  useRPC<void, number>('getTime', async () => Date.now());
}

// On peer B: call RPC
function Clock() {
  const { call } = useRPC<void, number>('getTime');
  useFrameUpdate(async () => {
    const now = await call();
    console.log('server time', now);
  });
}
```

## Reliable request/ack channel

```ts
import { useReliable, useChannel } from '@pulse-ts/network/fc/hooks';

// On peer B
function PurchaseClient() {
  const { send } = useReliable<{ item: string }, { ok: boolean }>('shop:buy');
  async function buy() {
    const res = await send({ item: 'potion' }, { timeoutMs: 1500, retries: 2 });
    console.log(res);
  }
}

// On peer A
function PurchaseServer() {
  const { subscribe } = useChannel<{ item: string }>('shop:buy');
  useInit(() => {
    const off = subscribe(async (req) => {
      // ...validate...
      return { ok: true };
    });
    return () => off();
  });
}
```

Tips:
- RPC is convenient for request/response semantics.
- Reliable channels provide retries and timeouts for at-least-once delivery.
- Use rooms on the broker to segment traffic by game session.
