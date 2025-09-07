# Core Concepts

Pulse is built around a few fundamental concepts that work together to create interactive applications. Understanding these core pieces is key to mastering Pulse development.

## What is an Entity Component System?

Pulse uses an **Entity Component System (ECS)** architecture. This is a design pattern that separates different aspects of your application:

- **Entities** (Nodes) - The "things" in your application
- **Components** - Data attached to entities
- **Systems** - Logic that processes components

**Why ECS?** Traditional object-oriented programming can become complex when many different objects need similar behaviors. ECS makes it easy to:
- Add behaviors to many objects at once
- Query objects by their properties
- Change object behavior without changing their class
- Keep your code modular and testable

**The key insight**: Instead of classes that mix data and behavior, ECS separates them. This makes your code more flexible and performant.

## 🌍 World

The **World** is the root container for everything in your Pulse application. Think of it as the "universe" where all your game objects and logic live.

### Creating a World

```typescript
import { World } from '@pulse-ts/core';

const world = new World({
  fixedStepMs: 1000 / 60,     // Physics timestep (60Hz)
  maxFixedStepsPerFrame: 8,   // Prevent spiral of death
  maxFrameDtMs: 250,          // Cap frame delta time
});
```

### World Responsibilities

The World manages:
- **Scene Graph** - All nodes and their hierarchy
- **Update Loop** - Fixed and frame-based timing
- **Systems Registry** - Global logic systems
- **Services Registry** - Singleton utilities
- **Component Registry** - Fast component lookups

### World Lifecycle

```typescript
const world = new World();

// Add your game objects and systems
world.mount(MyGame);

// Start the simulation
world.start();

// Control time
world.pause();
world.resume();
world.setTimeScale(0.5); // Slow motion

// Cleanup
world.stop();
```

## 🏷️ Nodes

**Nodes** are the entities in your scene graph. Every game object is a Node - players, enemies, bullets, cameras, etc.

### Creating Nodes

```typescript
import { Node } from '@pulse-ts/core';

// Direct creation
const player = new Node();

// Through functional nodes
function Player() {
  // This creates a Node automatically
  return null;
}
```

### Node Hierarchy

Nodes can form parent-child relationships:

```typescript
const parent = new Node();
const child = new Node();

// Add child to parent
parent.addChild(child);

// Child inherits parent's transform
child.parent === parent;        // true
parent.children.includes(child); // true
```

### Node Lifecycle

```typescript
const node = new Node();

// Custom initialization
node.onInit = () => {
  console.log('Node created!');
};

// Custom cleanup
node.onDestroy = () => {
  console.log('Node destroyed!');
};

// Add to world (triggers onInit)
world.add(node);

// Remove from world (triggers onDestroy)
world.remove(node);

// Or destroy completely
node.destroy();
```

## 🧩 Components

**Components** are data attached to Nodes. They describe what an entity *is* and *has*, but not what it *does*.

### Built-in Components

Pulse provides several essential components:

```typescript
import {
  Transform,    // Position, rotation, scale
  Visibility,   // Visible/hidden state
  State,        // Key-value storage
  StableId,     // Unique identifier for save/load
  Bounds        // Axis-aligned bounding box
} from '@pulse-ts/core';
```

### Creating Custom Components

```typescript
import { Component } from '@pulse-ts/core';

class Health extends Component {
  constructor(public current: number, public max: number) {
    super();
  }

  takeDamage(amount: number) {
    this.current = Math.max(0, this.current - amount);
  }
}

class Velocity extends Component {
  constructor(
    public x: number = 0,
    public y: number = 0,
    public z: number = 0
  ) {
    super();
  }
}
```

### Attaching Components

```typescript
const player = new Node();

// Method 1: Constructor attachment
player.attach(new Health(100, 100));
player.attach(new Velocity(0, 0, 0));

// Method 2: Functional component
function Player() {
  const health = useComponent(Health);
  const velocity = useComponent(Velocity);

  health.current = 100;
  velocity.x = 5;
}
```

### Component Queries

```typescript
import { getComponent } from '@pulse-ts/core';

// Get a component from a node
const health = getComponent(player, Health);
if (health) {
  console.log(`Health: ${health.current}/${health.max}`);
}

// Check if component exists
if (getComponent(player, Velocity)) {
  // Has velocity component
}
```

## ⚙️ Systems

**Systems** are where the logic lives. They operate on components to create behavior. Systems run automatically as part of the World's update loop.

### Creating Systems

```typescript
import { System } from '@pulse-ts/core';

class PhysicsSystem extends System {
  update(dt: number) {
    // Find all nodes with physics components
    for (const node of this.world.nodes) {
      const transform = getComponent(node, Transform);
      const velocity = getComponent(node, Velocity);

      if (transform && velocity) {
        // Apply physics
        transform.localPosition.x += velocity.x * dt;
        transform.localPosition.y += velocity.y * dt;

        // Apply gravity
        velocity.y -= 9.81 * dt;
      }
    }
  }
}
```

### System Lifecycle

```typescript
class MySystem extends System {
  onAttach(world: World) {
    // Called when system is added to world
    console.log('Physics system attached');
  }

  onDetach() {
    // Called when system is removed
    console.log('Physics system detached');
  }

  update(dt: number) {
    // Called every frame
  }
}

// Add to world
const physics = new PhysicsSystem();
world.addSystem(physics);

// Remove from world
world.removeSystem(PhysicsSystem);
```

### System Types

- **Frame Systems** - Run every frame (variable timing)
- **Fixed Systems** - Run at fixed timestep (consistent physics)
- **Custom Systems** - Specialized logic systems

## 🔧 Services

**Services** are singleton utilities and managers. Unlike Systems, Services don't run automatically - you call their methods when needed.

### Creating Services

```typescript
import { Service } from '@pulse-ts/core';

class AudioService extends Service {
  private audioContext: AudioContext;

  constructor() {
    super();
    this.audioContext = new AudioContext();
  }

  playSound(soundId: string, volume = 1.0) {
    // Play audio logic
    console.log(`Playing ${soundId} at volume ${volume}`);
  }

  stopAllSounds() {
    // Stop all audio
  }
}
```

### Using Services

```typescript
// Provide service to world
const audio = new AudioService();
world.provideService(audio);

// Get service from anywhere
function SoundButton() {
  const audio = useService(AudioService);

  const playSound = () => {
    audio.playSound('click');
  };

  return { playSound };
}

// Or get directly from world
const audioService = world.getService(AudioService);
audioService?.playSound('background_music');
```

### Common Service Patterns

- **Asset Management** - Loading and caching resources
- **Input Handling** - Keyboard, mouse, gamepad input
- **Networking** - Communication with servers
- **Audio** - Sound playback and management
- **Persistence** - Save/load game state

## Putting It All Together

Here's a complete example showing all concepts working together:

```typescript
import { World, Node, System, Service, Component } from '@pulse-ts/core';

// Custom component
class Position extends Component {
  constructor(public x = 0, public y = 0) {
    super();
  }
}

// Custom service
class ScoreService extends Service {
  private score = 0;

  addPoints(points: number) {
    this.score += points;
    console.log(`Score: ${this.score}`);
  }

  getScore() {
    return this.score;
  }
}

// Custom system
class MovementSystem extends System {
  update(dt: number) {
    for (const node of this.world.nodes) {
      const position = getComponent(node, Position);
      if (position) {
        position.x += 1 * dt; // Move right
      }
    }
  }
}

// Functional component
function Player() {
  const position = useComponent(Position);
  const scoreService = useService(ScoreService);

  useFrameUpdate(() => {
    if (position.x > 10) {
      scoreService.addPoints(10);
      position.x = 0; // Reset position
    }
  });
}

// Setup world
const world = new World();

// Add systems and services
world.addSystem(new MovementSystem());
world.provideService(new ScoreService());

// Create player
world.mount(Player);

// Start simulation
world.start();
```

## Best Practices

### Component Design
- **Single Responsibility** - Each component should do one thing
- **Data Only** - No logic in components, just data
- **Serializable** - Design for save/load if needed

### System Design
- **Focused Logic** - Each system handles one domain
- **Efficient Queries** - Minimize component lookups
- **Phase Awareness** - Use appropriate update phases

### Service Design
- **Singleton Pattern** - Only one instance per world
- **Clear API** - Well-defined public interface
- **No Dependencies** - Services shouldn't depend on each other

### World Organization
- **Logical Grouping** - Group related systems together
- **Initialization Order** - Add systems in dependency order
- **Performance Monitoring** - Use `world.debugStats()` to monitor

## Next Steps

Now that you understand the core concepts:

- **[Scene Graph](scene-graph.md)** - Learn about hierarchical transforms
- **[Functional Nodes](functional-nodes.md)** - React-style node patterns
- **[Update System](update-system.md)** - Understanding timing and phases
- **[Examples](examples.md)** - Real-world patterns and recipes

The core concepts provide the foundation for everything else in Pulse. Master these, and you'll be able to build anything!
