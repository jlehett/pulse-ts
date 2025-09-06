# Functional Components & Hooks

Pulse's **Functional Components** bring React-style patterns to game development. Write declarative, composable game objects using familiar hooks like `useState`, `useEffect`, and custom game-specific hooks.

## Component Basics

Functional Components (FCs) are functions that return `null` and use hooks to define behavior:

```typescript
import { useComponent, useFrameUpdate, Transform } from '@pulse-ts/core';

function Player() {
  // Get components
  const transform = useComponent(Transform);

  // Define behavior with hooks
  useFrameUpdate((dt) => {
    transform.localPosition.z += 5 * dt;
  });

  // FCs return null - all logic is in hooks
  return null;
}

// Mount the component
const world = new World();
world.mount(Player);
```

## Essential Hooks

### Lifecycle Hooks

```typescript
function MyComponent() {
  // Called when component mounts
  useInit(() => {
    console.log('Component initialized!');
    return () => console.log('Cleanup on unmount!');
  });

  // Called when component unmounts/destroys
  useDestroy(() => {
    console.log('Component destroyed!');
  });

  return null;
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

  return null;
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

  return null;
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
  return null;
}
```

### useStableId Hook

```typescript
function SaveableObject() {
  // Assign stable ID for save/load systems
  useStableId('player_character');

  // Object can now be found and restored after save/load
  const transform = useComponent(Transform);

  return null;
}
```

## Composition & Children

### useChild Hook

```typescript
function Spaceship() {
  // Mount child components
  const engine = useChild(Engine, { power: 100 });
  const wing1 = useChild(Wing, { side: 'left' });
  const wing2 = useChild(Wing, { side: 'right' });

  // Position children relative to parent
  useInit(() => {
    engine.getComponent(Transform).localPosition.set(0, -2, 1);
    wing1.getComponent(Transform).localPosition.set(-3, 0, 0);
    wing2.getComponent(Transform).localPosition.set(3, 0, 0);
  });

  return null;
}

function Engine({ power }: { power: number }) {
  const transform = useComponent(Transform);

  useFrameUpdate((dt) => {
    // Engine-specific logic
    console.log(`Engine power: ${power}`);
  });

  return null;
}
```

### Component Props

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

  return null;
}

// Usage
function Game() {
  const enemy1 = useChild(Enemy, { health: 50, speed: 2, type: 'basic' });
  const enemy2 = useChild(Enemy, { health: 100, speed: 4, type: 'fast' });
  const enemy3 = useChild(Enemy, { health: 200, speed: 1, type: 'tank' });

  return null;
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

  return null;
}
```

## Advanced Patterns

### Conditional Rendering

```typescript
function SmartEnemy() {
  const [state, setState] = useState('state', 'patrol');

  // Conditional child mounting
  const weapon = state === 'combat' ? useChild(Weapon) : null;
  const shield = state === 'defend' ? useChild(Shield) : null;

  useFrameUpdate(() => {
    if (playerNearby() && state !== 'combat') {
      setState('combat');
    }
  });

  return null;
}
```

### Component Arrays

```typescript
function ParticleSystem() {
  const [particles, setParticles] = useState('particles', [] as Node[]);

  useFrameUpdate((dt) => {
    // Spawn new particles
    if (Math.random() < 0.1) {
      const particle = useChild(Particle);
      setParticles(prev => [...prev, particle]);
    }

    // Update existing particles
    setParticles(prev => prev.filter(particle => {
      const age = particle.getComponent(Age);
      if (age.value > 5) {
        particle.destroy();
        return false;
      }
      return true;
    }));
  });

  return null;
}
```

### Async Operations

```typescript
function LoadingScreen() {
  const [isLoading, setIsLoading] = useState('loading', true);
  const [progress, setProgress] = useState('progress', 0);

  useInit(async () => {
    // Load assets
    await loadTextures();
    setProgress(0.5);

    await loadSounds();
    setProgress(1.0);

    setIsLoading(false);
  });

  if (isLoading) {
    return (
      <div>
        <div>Loading... {Math.round(progress * 100)}%</div>
        <div style={{ width: progress * 100 + '%' }} />
      </div>
    );
  }

  return <MainMenu />;
}
```

### Context-like Patterns

```typescript
// Game context hook
function useGameContext() {
  const world = useWorld();
  const [score, setScore] = useState('globalScore', 0);
  const [level, setLevel] = useState('level', 1);

  return {
    score,
    level,
    addScore: (points: number) => setScore(prev => prev + points),
    nextLevel: () => setLevel(prev => prev + 1),
  };
}

// Usage throughout app
function HUD() {
  const game = useGameContext();

  return (
    <div>
      <div>Score: {game.score}</div>
      <div>Level: {game.level}</div>
    </div>
  );
}

function Enemy() {
  const game = useGameContext();

  const die = () => {
    game.addScore(100);
  };

  return null;
}
```

## Hook Rules & Best Practices

### Rules of Hooks

1. **Only call hooks at the top level** of functional components
2. **Don't call hooks inside loops, conditions, or nested functions**
3. **Hooks can only be called during component execution**

```typescript
// ✅ Good
function GoodComponent() {
  const [count, setCount] = useState('count', 0);

  if (count > 5) {
    // Don't call hooks here!
  }

  useFrameUpdate(() => {
    setCount(prev => prev + 1);
  });

  return null;
}

// ❌ Bad
function BadComponent() {
  if (Math.random() > 0.5) {
    const [count, setCount] = useState('count', 0); // Wrong!
  }

  for (let i = 0; i < 5; i++) {
    useFrameUpdate(() => {}); // Wrong!
  }

  return null;
}
```

### Performance Tips

```typescript
function OptimizedComponent() {
  // ✅ Good: Cache expensive computations
  const expensiveValue = useMemo(() => {
    return complexCalculation();
  }, [dependency]);

  // ✅ Good: Use callback refs for stable references
  const callbackRef = useCallback(() => {
    doSomething();
  }, [dependency]);

  // ✅ Good: Debounce rapid updates
  const [debouncedValue, setDebouncedValue] = useState('debounced', 0);
  const debouncedSetter = useDebounce(setDebouncedValue, 100);

  return null;
}
```

### Cleanup Patterns

```typescript
function ResourceManager() {
  // ✅ Good: Cleanup resources
  useInit(() => {
    const connection = createWebSocket();
    return () => connection.close();
  });

  // ✅ Good: Cleanup timers
  useInit(() => {
    const timer = setInterval(() => {}, 1000);
    return () => clearInterval(timer);
  });

  // ✅ Good: Cleanup event listeners
  useInit(() => {
    const handler = () => {};
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  });

  return null;
}
```

## Common Patterns

### Component Communication

```typescript
// Parent-child communication
function Parent() {
  const [message, setMessage] = useState('message', '');

  const child = useChild(Child, {
    onMessage: (msg: string) => setMessage(msg)
  });

  return null;
}

function Child({ onMessage }: { onMessage: (msg: string) => void }) {
  useFrameUpdate(() => {
    if (somethingHappened) {
      onMessage('Hello from child!');
    }
  });

  return null;
}
```

### State Machines

```typescript
function EnemyAI() {
  const [state, setState] = useState('state', 'idle');

  // State machine logic
  useFrameUpdate(() => {
    switch (state) {
      case 'idle':
        if (playerNearby()) setState('chase');
        break;
      case 'chase':
        moveTowardsPlayer();
        if (playerInRange()) setState('attack');
        if (!playerNearby()) setState('idle');
        break;
      case 'attack':
        attackPlayer();
        setState('cooldown');
        break;
      case 'cooldown':
        // Wait for cooldown
        setTimeout(() => setState('idle'), 2000);
        break;
    }
  });

  return null;
}
```

Functional Components bring the power of React's mental model to game development. They make your code more declarative, composable, and easier to reason about. Start with simple components and gradually build up to complex, interactive game objects!
