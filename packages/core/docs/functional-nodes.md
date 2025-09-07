# Functional Nodes & Hooks

Pulse's **Functional Nodes** bring React-style patterns to application development. They create **Nodes** and use hooks to manage state and behavior.

## Node Basics

Functional Nodes (FNs) are functions that use hooks to define behavior:

```typescript
import { useComponent, useFrameUpdate, Transform } from '@pulse-ts/core';

function Player() {
  // Get components
  const transform = useComponent(Transform);

  // Define behavior with hooks
  useFrameUpdate((dt) => {
    transform.localPosition.z += 5 * dt;
  });
}

// Mount the node
const world = new World();
world.mount(Player);
```

## Essential Hooks

### Lifecycle Hooks

```typescript
function MyComponent() {
  // Called when node mounts
  useInit(() => {
    console.log('Component initialized!');
    return () => console.log('Cleanup on unmount!');
  });

  // Called when node unmounts/destroys
  useDestroy(() => {
    console.log('Component destroyed!');
  });
}
```

### Update Hooks

```typescript
function GameObject() {
  // Frame-based updates (variable timing)
  useFrameUpdate((dt) => {
    // Runs every frame, dt is seconds since last frame
  });

  // Fixed timestep updates (consistent physics)
  useFixedUpdate((dt) => {
    // Runs at fixed rate (default 60Hz), dt is fixed
  });

  // Early/late variants for ordering
  useFrameEarly((dt) => {
    // Runs before useFrameUpdate
  });

  useFrameLate((dt) => {
    // Runs after useFrameUpdate
  });
}
```

### Component Hooks

```typescript
function Character() {
  // Get existing or create new component
  const transform = useComponent(Transform);
  const health = useComponent(Health);

  // Initialize health if needed
  useInit(() => {
    if (health.current === 0) {
      health.current = 100;
      health.max = 100;
    }
  });
}
```

## State Management

### useState Hook

```typescript
function Counter() {
  // Persistent state across re-mounts
  const [count, setCount] = useState('counter', 0);
  const [name, setName] = useState('name', 'Player');

  useFrameUpdate(() => {
    // Increment every second
    setCount(prev => prev + 1);
  });

  console.log(`${name}: ${count}`);
}
```

### useStableId Hook

```typescript
function SaveableObject() {
  // Assign stable ID for save/load systems
  useStableId('player_character');

  // Object can now be found and restored after save/load
  const transform = useComponent(Transform);
}
```

## Composition & Children

### useChild Hook

```typescript
function Spaceship() {
  // Mount child nodes
  const engine = useChild(Engine, { power: 100 });
  const wing1 = useChild(Wing, { side: 'left' });
  const wing2 = useChild(Wing, { side: 'right' });

  // Position children relative to parent
  useInit(() => {
    engine.getComponent(Transform).localPosition.set(0, -2, 1);
    wing1.getComponent(Transform).localPosition.set(-3, 0, 0);
    wing2.getComponent(Transform).localPosition.set(3, 0, 0);
  });
}

function Engine({ power }: { power: number }) {
  const transform = useComponent(Transform);

  useFrameUpdate((dt) => {
    // Engine-specific logic
    console.log(`Engine power: ${power}`);
  });
}
```

### Node Props

```typescript
interface EnemyProps {
  health: number;
  speed: number;
  type: 'basic' | 'fast' | 'tank';
}

function Enemy({ health, speed, type }: EnemyProps) {
  const transform = useComponent(Transform);
  const [currentHealth, setHealth] = useState('health', health);

  useFrameUpdate((dt) => {
    // Movement based on type
    const moveSpeed = type === 'fast' ? speed * 2 : speed;
    transform.localPosition.z += moveSpeed * dt;
  });
}

// Usage
function Game() {
  const enemy1 = useChild(Enemy, { health: 50, speed: 2, type: 'basic' });
  const enemy2 = useChild(Enemy, { health: 100, speed: 4, type: 'fast' });
  const enemy3 = useChild(Enemy, { health: 200, speed: 1, type: 'tank' });
}
```

## Custom Hooks

Create reusable behavior with custom hooks:

```typescript
// Movement hook
function useMovement(speed: number) {
  const transform = useComponent(Transform);
  const [velocity, setVelocity] = useState('velocity', { x: 0, y: 0, z: 0 });

  const move = (direction: Vec3) => {
    setVelocity(prev => ({
      x: prev.x + direction.x * speed,
      y: prev.y + direction.y * speed,
      z: prev.z + direction.z * speed,
    }));
  };

  useFrameUpdate((dt) => {
    transform.localPosition.x += velocity.x * dt;
    transform.localPosition.y += velocity.y * dt;
    transform.localPosition.z += velocity.z * dt;

    // Apply friction
    setVelocity(prev => ({
      x: prev.x * 0.95,
      y: prev.y * 0.95,
      z: prev.z * 0.95,
    }));
  });

  return { move, velocity };
}

// Health hook
function useHealth(initial: number) {
  const [health, setHealth] = useState('health', initial);
  const [maxHealth, setMaxHealth] = useState('maxHealth', initial);

  const takeDamage = (amount: number) => {
    setHealth(prev => Math.max(0, prev - amount));
  };

  const heal = (amount: number) => {
    setHealth(prev => Math.min(maxHealth, prev + amount));
  };

  const isDead = health <= 0;

  return {
    health,
    maxHealth,
    takeDamage,
    heal,
    isDead,
    setMaxHealth,
  };
}

// Usage
function Player() {
  const movement = useMovement(5);
  const health = useHealth(100);

  useFrameUpdate(() => {
    if (health.isDead) {
      console.log('Player died!');
      return;
    }

    // Handle input
    if (input.left) movement.move(new Vec3(-1, 0, 0));
    if (input.right) movement.move(new Vec3(1, 0, 0));
    if (input.up) movement.move(new Vec3(0, 0, 1));
  });
}
```
