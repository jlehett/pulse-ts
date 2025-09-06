# Getting Started

Welcome to Pulse! This guide will walk you through creating your first Pulse application from scratch. We'll build a simple interactive scene with moving objects and user input.

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

Now let's create something visual. We'll make a simple colored square that moves around. Create `src/components/MovingSquare.ts`:

```typescript
import { useComponent, useFrameUpdate, Transform } from '@pulse-ts/core';

export function MovingSquare() {
  // Get the transform component (position, rotation, scale)
  const transform = useComponent(Transform);

  // State for our movement
  let time = 0;

  // Update every frame (typically 60fps)
  useFrameUpdate((dt) => {
    time += dt;

    // Move in a circle
    const radius = 2;
    transform.localPosition.x = Math.cos(time) * radius;
    transform.localPosition.y = Math.sin(time) * radius;

    // Spin the square
    transform.localRotation.z = time;
  });

  console.log('MovingSquare mounted!');
}
```

Update your main app:

```typescript
// ... existing code ...

function App() {
  console.log('Pulse app started!');

  // Mount our moving square
  const square = useChild(MovingSquare);
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

You should now see both "Pulse app started!" and "MovingSquare mounted!" - your square is moving in a circle!

## Making It Interactive

Let's add keyboard input to control the square. First, install the input package:

```bash
npm install @pulse-ts/input
```

Create an input provider and bind some keys. Update `src/index.ts`:

```typescript
import { World, mount, useChild } from '@pulse-ts/core';
import { installInput, useKey } from '@pulse-ts/input';

// Create input provider (handles keyboard, mouse, gamepad)
const inputProvider = installInput();

function MovingSquare() {
  const transform = useComponent(Transform);

  // Get keyboard input
  const left = useKey('ArrowLeft');
  const right = useKey('ArrowRight');
  const up = useKey('ArrowUp');
  const down = useKey('ArrowDown');

  let time = 0;

  useFrameUpdate((dt) => {
    time += dt;

    // Keyboard movement (overrides automatic movement)
    if (left.pressed) transform.localPosition.x -= 5 * dt;
    if (right.pressed) transform.localPosition.x += 5 * dt;
    if (up.pressed) transform.localPosition.y += 5 * dt;
    if (down.pressed) transform.localPosition.y -= 5 * dt;

    // If no keys pressed, do automatic movement
    if (!left.pressed && !right.pressed && !up.pressed && !down.pressed) {
      const radius = 2;
      transform.localPosition.x = Math.cos(time) * radius;
      transform.localPosition.y = Math.sin(time) * radius;
    }

    // Always spin
    transform.localRotation.z = time;
  });
}

function App() {
  // Mount our interactive square
  const square = useChild(MovingSquare);
}

// Create world with input
const world = new World();
world.provideService(inputProvider);
world.mount(App);
world.start();
```

Now run it:

```bash
npm run dev
```

Use the arrow keys to move your square around! When you release the keys, it goes back to automatic circular movement.

## Adding Physics

Let's make this more realistic with proper physics. We'll add velocity and gravity. Update `MovingSquare`:

```typescript
function MovingSquare() {
  const transform = useComponent(Transform);

  // Physics properties
  let velocityX = 0;
  let velocityY = 0;
  const gravity = -9.81;
  const damping = 0.98;
  const moveSpeed = 10;

  // Get input
  const left = useKey('ArrowLeft');
  const right = useKey('ArrowRight');
  const up = useKey('ArrowUp');
  const space = useKey('Space');

  useFrameUpdate((dt) => {
    // Apply gravity
    velocityY += gravity * dt;

    // Input forces
    if (left.pressed) velocityX -= moveSpeed * dt;
    if (right.pressed) velocityX += moveSpeed * dt;
    if (up.pressed || space.justPressed) velocityY += 15; // Jump!

    // Apply velocity to position
    transform.localPosition.x += velocityX * dt;
    transform.localPosition.y += velocityY * dt;

    // Ground collision
    if (transform.localPosition.y < 0) {
      transform.localPosition.y = 0;
      velocityY = -velocityY * 0.8; // Bounce with energy loss
    }

    // Air resistance
    velocityX *= damping;
    velocityY *= damping;

    // Spin based on movement
    const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
    transform.localRotation.z += speed * dt;
  });
}
```

Now you have a bouncing, physics-driven square! Use arrow keys to move and spacebar to jump.

## Adding Multiple Objects

Let's create a whole scene with multiple moving objects. Create `src/components/BouncingBall.ts`:

```typescript
export function BouncingBall({ color }: { color: string }) {
  const transform = useComponent(Transform);

  let velocityX = (Math.random() - 0.5) * 10;
  let velocityY = Math.random() * 5;
  const gravity = -9.81;
  const damping = 0.99;

  useFrameUpdate((dt) => {
    velocityY += gravity * dt;

    transform.localPosition.x += velocityX * dt;
    transform.localPosition.y += velocityY * dt;

    // Bounce off walls
    if (transform.localPosition.x < -5 || transform.localPosition.x > 5) {
      velocityX = -velocityX * 0.9;
      transform.localPosition.x = Math.max(-5, Math.min(5, transform.localPosition.x));
    }

    // Bounce off ground
    if (transform.localPosition.y < 0) {
      velocityY = -velocityY * 0.9;
      transform.localPosition.y = 0;
    }

    // Air resistance
    velocityX *= damping;
    velocityY *= damping;

    // Spin
    transform.localRotation.z += velocityX * dt * 0.1;
  });

  console.log(`Ball ${color} spawned!`);
}
```

Update your main app to spawn multiple balls:

```typescript
function App() {
  // Spawn several bouncing balls
  const colors = ['red', 'blue', 'green', 'yellow', 'purple'];

  for (let i = 0; i < 5; i++) {
    const ball = useChild(BouncingBall, { color: colors[i] });
    // Position them in a line
    ball.getComponent(Transform).localPosition.x = (i - 2) * 2;
    ball.getComponent(Transform).localPosition.y = 3;
  }
}
```

## Performance Monitoring

Let's add some basic performance stats:

```typescript
function App() {
  // ... existing ball spawning code ...

  // Log performance stats every second
  let lastStatsTime = 0;
  useFrameUpdate((dt) => {
    lastStatsTime += dt;
    if (lastStatsTime >= 1.0) {
      const stats = world.debugStats();
      console.log(`FPS: ${stats.fps.toFixed(1)}, Nodes: ${stats.nodes}`);
      lastStatsTime = 0;
    }
  });
}
```

## Next Steps

You've built a complete interactive scene with:

✅ Basic Pulse setup
✅ Component-based architecture
✅ User input handling
✅ Physics simulation
✅ Multiple game objects
✅ Performance monitoring

## What's Next?

- **[Core Concepts](core-concepts.md)** - Deep dive into World, Nodes, and Components
- **[Scene Graph](scene-graph.md)** - Building hierarchical game objects
- **[Functional Components](functional-components.md)** - Advanced component patterns
- **[Update System](update-system.md)** - Understanding timing and updates
- **[Examples](examples.md)** - More complex patterns and recipes

Happy coding with Pulse! 🚀
