# Examples & Patterns

This guide contains practical examples and recipes for common patterns using @pulse-ts/core. Each example demonstrates core concepts with explanation.

## Basic Patterns

### Managing State
Components often need to track changing values. Pulse provides the `useState` hook for this:

```typescript
function Counter() {
  const [count, setCount] = useState('counter', 0);

  useFrameUpdate((dt) => {
    // Increment counter over time
    setCount(prev => prev + dt);
  });
}
```

**Why this matters:** State management is fundamental to interactive applications. The `useState` hook provides persistent storage that survives component re-renders.

### Lifecycle Management
Components have lifecycle hooks for setup and cleanup:

```typescript
function MyComponent() {
  useInit(() => {
    console.log('Component is being created');
    // Setup code here
  });

  useDestroy(() => {
    console.log('Component is being destroyed');
    // Cleanup code here
  });
}
```

**Why this matters:** Proper cleanup prevents memory leaks and ensures resources are freed when components are no longer needed.

### Timing Patterns
Different update frequencies serve different purposes:

```typescript
function GameLogic() {
  // Fixed updates for consistent behavior
  useFixedUpdate((dt) => {
    // Physics, game state updates
  });

  // Frame updates for smooth visuals
  useFrameUpdate((dt) => {
    // Animation, UI updates
  });
}
```

**Why this matters:** Interactive applications need both consistency (fixed updates) and responsiveness (frame updates).

## Component Composition

### Creating Child Components
Functional components can create other components as children:

```typescript
function ParentComponent() {
  // Create child components
  useChild(ChildComponent, { name: 'child1' });
  useChild(ChildComponent, { name: 'child2' });
}

function ChildComponent({ name }: { name: string }) {
  useInit(() => {
    console.log(`Child ${name} created`);
  });
}
```

**Why this matters:** Component composition allows you to build complex behavior from simple, reusable pieces. Each component focuses on a single responsibility.

### State Machines
Many applications need to manage different states or modes:

```typescript
function AppState() {
  const [currentState, setCurrentState] = useState('appState', 'loading');

  useFrameUpdate((dt) => {
    switch (currentState) {
      case 'loading':
        // Simulate loading completion
        if (Math.random() < 0.01) { // 1% chance per frame
          setCurrentState('running');
          console.log('App state: loading → running');
        }
        break;

      case 'running':
        // Normal operation
        break;
    }
  });
}
```

**Why this matters:** State machines help manage complex application flow. They're essential for games and interactive applications.

## Working with Data

### Custom Components
You can create custom components to store application-specific data:

```typescript
class PlayerData extends Component {
  constructor(
    public health: number = 100,
    public score: number = 0
  ) {
    super();
  }
}

function Player() {
  const data = useComponent(PlayerData);

  // Use the data in your component
  useFrameUpdate(() => {
    if (data.health > 0) {
      data.score += 1;
    }
  });
}
```

**Why this matters:** Custom components allow you to structure your application's data in meaningful ways.

### Services for Shared State
Services provide global functionality and shared state:

```typescript
class GameState extends Service {
  private _score = 0;

  get score() { return this._score; }

  addPoints(points: number) {
    this._score += points;
  }
}

function ScoreDisplay() {
  const gameState = useService(GameState);

  useFrameUpdate(() => {
    console.log(`Current score: ${gameState.score}`);
  });
}
```

**Why this matters:** Services enable communication between different parts of your application without tight coupling.

## Putting It Together

Here's how these patterns work together in a complete application:

```typescript
function MyApp() {
  // Set up global services
  const gameState = new GameState();
  world.provideService(gameState);

  // Create application components
  useChild(StateManager);
  useChild(DataManager);
  useChild(UserInterface);

  console.log('Application started');
}

function StateManager() {
  const [appState, setAppState] = useState('appState', 'initializing');

  useFrameUpdate(() => {
    // Transition between application states
    if (appState === 'initializing' && Math.random() < 0.01) {
      setAppState('running');
    }
  });
}

function DataManager() {
  const gameState = useService(GameState);

  useFixedUpdate(() => {
    // Update game state consistently
    gameState.update();
  });
}

function UserInterface() {
  const gameState = useService(GameState);

  useFrameUpdate(() => {
    // Update UI responsively
    console.log(`Score: ${gameState.score}`);
  });
}
```

These examples demonstrate the core patterns you'll use when building applications with @pulse-ts/core. Start with simple components and gradually combine them into complex systems. The key is understanding how Nodes, Components, and Services work together to create maintainable, scalable applications.
