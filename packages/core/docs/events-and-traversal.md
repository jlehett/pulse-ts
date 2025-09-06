# Events & Traversal

## TypedEvent

Single-channel, strongly-typed event.

```ts
import { TypedEvent } from '@pulse-ts/core';

type Hit = { dmg: number };
const onHit = new TypedEvent<Hit>();

const off = onHit.on(e => console.log('hit for', e.dmg));
onHit.emit({ dmg: 5 });
off();

onHit.once(e => console.log('first and only hit'));
onHit.emit({ dmg: 1 });

console.log(onHit.size); // listener count
onHit.clear();
```

## EventBus

Multi-channel typed event bus.

```ts
import { EventBus } from '@pulse-ts/core';

type PlayerEvents = {
  spawn: { id: number };
  hit: { dmg: number };
};

const bus = new EventBus<PlayerEvents>();
const off = bus.on('hit', e => console.log('hit', e.dmg));
bus.emit('hit', { dmg: 5 });
off();

bus.once('spawn', e => console.log('spawned', e.id));
bus.emit('spawn', { id: 1 });

console.log(bus.size('hit'));
bus.clear('hit');
```

## Traversal helpers

Utilities for working with the node tree.

```ts
import {
  ancestors,
  descendants,
  traversePreOrder,
  traversePostOrder,
  siblings,
} from '@pulse-ts/core';

// ...see examples in World & Nodes guide
```

