# Getting Started

Welcome to Pulse! This guide will walk you through creating your first Pulse application from scratch. We'll build a simple timer application that demonstrates the core concepts of timing, state management, and component composition.

## Prerequisites

- Node.js 16+ and npm
- Basic TypeScript knowledge
- A code editor (VS Code recommended)

## Project Setup

Let's create a new Pulse project:

```bash
# Create a new directory for your project
mkdir my-pulse-game
cd my-pulse-game

# Initialize npm project
npm init -y

# Install Pulse core
npm install @pulse-ts/core

# Install dev dependencies
npm install -D typescript @types/node
```

Create a `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

Create the basic folder structure:

```
my-pulse-game/
├── src/
│   ├── index.ts
│   └── components/
├── package.json
├── tsconfig.json
└── dist/
```

Update your `package.json` scripts:

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsc && node dist/index.js"
  }
}
```

## Your First Pulse App

Let's create a simple interactive scene. In `src/index.ts`:

```typescript
import { World, mount } from '@pulse-ts/core';

function App() {
  // This is our root component
  console.log('Pulse app started!');
}

const world = new World();
world.mount(App);
world.start();

console.log('World is running...');
```

Run it:

```bash
npm run dev
```

You should see "Pulse app started!" and "World is running..." in your console. Congratulations! You have a basic Pulse world running.

## Adding Your First Component

Now let's create a timer component that demonstrates state management and updates. Create `src/components/Timer.ts`:

```typescript
import { useComponent, useFrameUpdate, useState, Transform } from '@pulse-ts/core';

export function Timer() {
  // Get the transform component (position, rotation, scale)
  const transform = useComponent(Transform);

  // State for our timer
  const [elapsedTime, setElapsedTime] = useState('elapsedTime', 0);
  const [updateCount, setUpdateCount] = useState('updateCount', 0);

  // Update every frame (typically 60fps)
  useFrameUpdate((dt) => {
    setElapsedTime(prev => prev + dt);
    setUpdateCount(prev => prev + 1);

    // Move in a circle based on elapsed time
    const radius = 2;
    transform.localPosition.x = Math.cos(elapsedTime) * radius;
    transform.localPosition.y = Math.sin(elapsedTime) * radius;

    // Spin based on time
    transform.localRotation.z = elapsedTime;

    // Log progress every second
    if (Math.floor(elapsedTime) !== Math.floor(elapsedTime - dt)) {
      console.log(`Timer: ${Math.floor(elapsedTime)}s, Updates: ${updateCount}`);
    }
  });

  console.log('Timer component mounted!');
}
```

Update your main app:

```typescript
// ... existing code ...

function App() {
  console.log('Pulse app started!');

  // Mount our timer
  const timer = useChild(Timer);
}

// ... existing code ...
```

Wait, we need to import `useChild`. Let's fix that:

```typescript
import { World, mount, useChild } from '@pulse-ts/core';
```

Run it again:

```bash
npm run dev
```

You should now see both "Pulse app started!" and "Timer component mounted!" followed by regular updates showing elapsed time and update counts.

## Understanding Fixed vs Frame Updates

Let's create a component that demonstrates the difference between fixed and frame updates. Update `src/components/Timer.ts`:

```typescript
export function PhysicsTimer() {
  const [frameCount, setFrameCount] = useState('frameCount', 0);
  const [fixedCount, setFixedCount] = useState('fixedCount', 0);

  // Frame updates (variable timing)
  useFrameUpdate((dt) => {
    setFrameCount(prev => prev + 1);
    console.log(`Frame update #${frameCount} - Delta: ${dt.toFixed(4)}s`);
  });

  // Fixed updates (consistent timing)
  useFixedUpdate((dt) => {
    setFixedCount(prev => prev + 1);
    console.log(`Fixed update #${fixedCount} - Delta: ${dt.toFixed(4)}s`);
  });
}

export function CombinedTimer() {
  const [physicsTime, setPhysicsTime] = useState('physicsTime', 0);
  const [renderTime, setRenderTime] = useState('renderTime', 0);

  // Physics at fixed rate (consistent)
  useFixedUpdate((dt) => {
    setPhysicsTime(prev => prev + dt);
    console.log(`Physics time: ${physicsTime.toFixed(2)}s (fixed rate)`);
  });

  // Rendering at frame rate (variable)
  useFrameUpdate((dt) => {
    setRenderTime(prev => prev + dt);
    console.log(`Render time: ${renderTime.toFixed(2)}s (frame rate)`);
  });
}
```

Update your main app to use these:

```typescript
function App() {
  console.log('Pulse app started!');

  // Mount our timers to see the difference
  const physicsTimer = useChild(PhysicsTimer);
  const combinedTimer = useChild(CombinedTimer);
}
```

## State Management and Persistence

Let's create a component that demonstrates persistent state and lifecycle hooks. Update `src/components/Timer.ts`:

```typescript
export function PersistentCounter() {
  const [count, setCount] = useState('persistentCount', 0);
  const [startTime, setStartTime] = useState('startTime', Date.now());

  // Initialize when component mounts
  useInit(() => {
    console.log('Counter initialized with count:', count);
    setStartTime(Date.now());
  });

  // Cleanup when component unmounts/destroys
  useDestroy(() => {
    const lifetime = Date.now() - startTime;
    console.log(`Counter destroyed after ${lifetime}ms, final count: ${count}`);
  });

  useFrameUpdate((dt) => {
    // Increment every 100ms
    if (Math.floor(Date.now() / 100) !== Math.floor((Date.now() - dt * 1000) / 100)) {
      setCount(prev => prev + 1);
      console.log(`Count: ${count + 1}`);
    }
  });
}
```

Update your main app to use the persistent counter:

```typescript
function App() {
  console.log('Pulse app started!');

  // Mount our persistent counter
  const counter = useChild(PersistentCounter);
}
```

## Multiple Components

Let's create a scene with multiple interacting components. Create `src/components/Producer.ts` and `src/components/Consumer.ts`:

```typescript
// Producer.ts
export function Producer() {
  const [produced, setProduced] = useState('produced', 0);

  useFixedUpdate((dt) => {
    setProduced(prev => prev + 1);
    console.log(`Producer: Created item #${produced + 1}`);
  });
}

// Consumer.ts
export function Consumer() {
  const [consumed, setConsumed] = useState('consumed', 0);

  useFixedUpdate((dt) => {
    setConsumed(prev => prev + 1);
    console.log(`Consumer: Processed item #${consumed + 1}`);
  });
}

// Monitor.ts
export function Monitor() {
  const [updates, setUpdates] = useState('updates', 0);

  useFrameUpdate((dt) => {
    setUpdates(prev => prev + 1);

    // Log stats every 60 frames (about 1 second at 60fps)
    if (updates % 60 === 0) {
      console.log(`Monitor: ${updates} frames processed`);
    }
  });
}
```

Update your main app to create multiple components:

```typescript
function App() {
  console.log('Pulse app started!');

  // Create multiple producers and consumers
  for (let i = 0; i < 3; i++) {
    useChild(Producer);
    useChild(Consumer);
  }

  // Add a monitor
  useChild(Monitor);
}
```

## Performance Monitoring

Let's add some basic performance stats. Update your main app:

```typescript
function App() {
  const [totalUpdates, setTotalUpdates] = useState('totalUpdates', 0);
  const [lastStatsTime, setLastStatsTime] = useState('lastStatsTime', 0);

  // Log performance stats every second
  useFrameUpdate((dt) => {
    setTotalUpdates(prev => prev + 1);
    setLastStatsTime(prev => prev + dt);

    if (lastStatsTime >= 1.0) {
      const stats = world.debugStats();
      console.log(`FPS: ${stats.fps.toFixed(1)}, Nodes: ${stats.nodes}, Total Updates: ${totalUpdates}`);
      setLastStatsTime(0);
    }
  });

  // ... existing component mounting code ...
}
```

## Next Steps

You've built a complete Pulse application demonstrating core concepts:

✅ Basic Pulse setup and World creation
✅ Component-based architecture with state management
✅ Fixed vs frame update timing
✅ Lifecycle hooks (init/destroy)
✅ Multiple interacting components
✅ Performance monitoring and debugging

## What's Next?

- **[Core Concepts](core-concepts.md)** - Deep dive into World, Nodes, and Components
- **[Scene Graph](scene-graph.md)** - Building hierarchical game objects
- **[Functional Components](functional-components.md)** - Advanced component patterns
- **[Update System](update-system.md)** - Understanding timing and updates
- **[Examples](examples.md)** - More complex patterns and recipes

Happy coding with Pulse! 🚀
