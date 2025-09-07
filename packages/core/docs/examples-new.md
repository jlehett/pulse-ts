# Examples & Patterns

This guide contains practical examples and recipes for common patterns using @pulse-ts/core. Each example demonstrates core concepts like timing, state management, and component composition.

## Basic Components

### Timer Component

```typescript
function Timer() {
  const [elapsedTime, setElapsedTime] = useState('elapsedTime', 0);
  const [updateCount, setUpdateCount] = useState('updateCount', 0);

  useFrameUpdate((dt) => {
    setElapsedTime(prev => prev + dt);
    setUpdateCount(prev => prev + 1);

    // Log progress every second
    if (Math.floor(elapsedTime) !== Math.floor(elapsedTime - dt)) {
      console.log(`Timer: ${Math.floor(elapsedTime)}s, Updates: ${updateCount}`);
    }
  });
}
```

### Counter with Persistence

```typescript
function PersistentCounter({ name }: { name: string }) {
  const [count, setCount] = useState(`${name}_count`, 0);
  const [startTime, setStartTime] = useState(`${name}_startTime`, Date.now());

  useInit(() => {
    console.log(`${name} initialized with count: ${count}`);
  });

  useDestroy(() => {
    const lifetime = Date.now() - startTime;
    console.log(`${name} destroyed after ${lifetime}ms, final count: ${count}`);
  });

  useFrameUpdate((dt) => {
    // Increment every 100ms
    if (Math.floor(Date.now() / 100) !== Math.floor((Date.now() - dt * 1000) / 100)) {
      setCount(prev => prev + 1);
    }
  });

  return count; // Return current count
}
```

### Physics Object

```typescript
function PhysicsObject() {
  const transform = useComponent(Transform);
  const [velocity, setVelocity] = useState('velocity', new Vec3(0, 0, 0));
  const [position, setPosition] = useState('position', new Vec3(0, 0, 0));

  useFixedUpdate((dt) => {
    // Apply gravity
    const gravity = new Vec3(0, -9.81, 0);
    setVelocity(prev => Vec3.add(prev, Vec3.multiply(gravity, dt)));

    // Apply velocity to position
    const deltaPos = Vec3.multiply(velocity, dt);
    setPosition(prev => Vec3.add(prev, deltaPos));

    // Update transform
    transform.localPosition.copy(position);

    // Ground collision
    if (position.y < 0) {
      setPosition(prev => ({ ...prev, y: 0 }));
      setVelocity(prev => ({ ...prev, y: -prev.y * 0.8 })); // Bounce
    }

    // Air resistance
    setVelocity(prev => Vec3.multiply(prev, 0.99));
  });

  useFrameUpdate(() => {
    // Log position occasionally
    if (Math.random() < 0.01) { // 1% chance per frame
      console.log(`Physics object at: (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`);
    }
  });
}
```

## Component Composition

### Producer-Consumer Pattern

```typescript
function Producer() {
  const [produced, setProduced] = useState('produced', 0);

  useFixedUpdate((dt) => {
    setProduced(prev => prev + 1);
    console.log(`Producer: Created item #${produced + 1}`);
  });
}

function Consumer() {
  const [consumed, setConsumed] = useState('consumed', 0);

  useFixedUpdate((dt) => {
    setConsumed(prev => prev + 1);
    console.log(`Consumer: Processed item #${consumed + 1}`);
  });
}

function ProducerConsumerSystem() {
  // Create multiple producers and consumers
  for (let i = 0; i < 3; i++) {
    useChild(Producer);
    useChild(Consumer);
  }
}
```

### State Machine

```typescript
function StateMachine() {
  const [state, setState] = useState('state', 'idle');
  const [stateTime, setStateTime] = useState('stateTime', 0);

  useFrameUpdate((dt) => {
    setStateTime(prev => prev + dt);

    switch (state) {
      case 'idle':
        if (stateTime > 2) { // Wait 2 seconds
          setState('working');
          setStateTime(0);
          console.log('State: idle → working');
        }
        break;

      case 'working':
        if (stateTime > 5) { // Work for 5 seconds
          setState('resting');
          setStateTime(0);
          console.log('State: working → resting');
        }
        break;

      case 'resting':
        if (stateTime > 1) { // Rest for 1 second
          setState('idle');
          setStateTime(0);
          console.log('State: resting → idle');
        }
        break;
    }
  });
}
```

## Advanced Patterns

### Transform Hierarchy

```typescript
function ParentObject() {
  const transform = useComponent(Transform);

  // Create child objects
  const child1 = useChild(ChildObject, { offset: new Vec3(2, 0, 0) });
  const child2 = useChild(ChildObject, { offset: new Vec3(-2, 0, 0) });

  useFrameUpdate((dt) => {
    // Rotate parent
    transform.localRotation.y += dt;

    // Children inherit parent's transform
    console.log('Parent position:', transform.worldPosition);
  });
}

function ChildObject({ offset }: { offset: Vec3 }) {
  const transform = useComponent(Transform);

  useInit(() => {
    // Set local offset from parent
    transform.localPosition.copy(offset);
  });

  useFrameUpdate(() => {
    // Child position is relative to parent
    console.log('Child world position:', transform.worldPosition);
  });
}
```

### Performance Monitor

```typescript
function PerformanceMonitor() {
  const [frameCount, setFrameCount] = useState('frameCount', 0);
  const [lastFpsTime, setLastFpsTime] = useState('lastFpsTime', 0);

  useFrameUpdate((dt) => {
    setFrameCount(prev => prev + 1);
    setLastFpsTime(prev => prev + dt);

    // Log FPS every second
    if (lastFpsTime >= 1.0) {
      const fps = frameCount / lastFpsTime;
      console.log(`FPS: ${fps.toFixed(1)}`);

      // Reset counters
      setFrameCount(0);
      setLastFpsTime(0);
    }
  });
}
```

### Component Registry

```typescript
// Custom component for managing collections
class EntityManager extends Component {
  entities: Map<string, Node> = new Map();

  addEntity(id: string, node: Node) {
    this.entities.set(id, node);
  }

  getEntity(id: string) {
    return this.entities.get(id);
  }

  removeEntity(id: string) {
    this.entities.delete(id);
  }
}

function EntityRegistry() {
  const manager = useComponent(EntityManager);

  useInit(() => {
    // Create and register entities
    const entity1 = useChild(Timer);
    const entity2 = useChild(PersistentCounter, { name: 'counter1' });

    manager.addEntity('timer', entity1);
    manager.addEntity('counter', entity2);

    console.log('Entities registered:', Array.from(manager.entities.keys()));
  });

  useFrameUpdate(() => {
    // Monitor entity count
    console.log(`Active entities: ${manager.entities.size}`);
  });
}
```

## Service Patterns

### Statistics Service

```typescript
class StatsService extends Service {
  private stats: Map<string, number> = new Map();

  increment(key: string, amount = 1) {
    this.stats.set(key, (this.stats.get(key) || 0) + amount);
  }

  get(key: string): number {
    return this.stats.get(key) || 0;
  }

  logAll() {
    console.log('Statistics:');
    for (const [key, value] of this.stats) {
      console.log(`  ${key}: ${value}`);
    }
  }
}

function StatsTracker() {
  const stats = useService(StatsService);

  useFrameUpdate((dt) => {
    stats.increment('totalFrames');
    stats.increment('totalTime', dt);

    if (Math.floor(Date.now() / 1000) !== Math.floor((Date.now() - dt * 1000) / 1000)) {
      stats.logAll();
    }
  });
}
```

### Event System

```typescript
class EventService extends Service {
  private listeners: Map<string, Array<(data: any) => void>> = new Map();

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event) || [];
    for (const listener of eventListeners) {
      listener(data);
    }
  }
}

function EventEmitter() {
  const events = useService(EventService);

  useFrameUpdate((dt) => {
    // Emit events based on time
    if (Math.floor(Date.now() / 2000) !== Math.floor((Date.now() - dt * 1000) / 2000)) {
      events.emit('twoSecondsPassed', { timestamp: Date.now() });
    }
  });
}

function EventListener() {
  const events = useService(EventService);

  useInit(() => {
    events.on('twoSecondsPassed', (data) => {
      console.log('Event received:', data);
    });
  });
}
```

## Complete Application

### Multi-Component System

```typescript
function Game() {
  // Performance monitoring
  useChild(PerformanceMonitor);

  // Statistics tracking
  const statsService = new StatsService();
  world.provideService(statsService);
  useChild(StatsTracker);

  // Event system
  const eventService = new EventService();
  world.provideService(eventService);
  useChild(EventEmitter);
  useChild(EventListener);

  // Game entities
  for (let i = 0; i < 5; i++) {
    useChild(Timer);
    useChild(PersistentCounter, { name: `counter${i}` });
  }

  // Producer-consumer system
  useChild(ProducerConsumerSystem);

  // Physics simulation
  useChild(PhysicsObject);

  // State machine
  useChild(StateMachine);

  console.log('Game initialized with multiple systems');
}
```

These examples demonstrate the core patterns you'll use when building applications with @pulse-ts/core. Start with simple components and gradually combine them into complex systems!
