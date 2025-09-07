# @pulse-ts/core

The core runtime for Pulse TS, a modular TypeScript game engine built for real-time, interactive applications.

```bash
npm install @pulse-ts/core
```

## What is Pulse?

Pulse is an **Entity Component System (ECS)** framework designed specifically for building interactive applications. Think of it as React meets game development - you compose your app from small, focused pieces that work together seamlessly.

Unlike traditional game engines, Pulse embraces **composability** and **modularity**. You can build complex behaviors by combining simple components, and extend the engine with custom packages for your specific needs.

## Quick Start

Let's build your first Pulse app - a simple counter that demonstrates the update system:

```typescript
import { World, mount } from '@pulse-ts/core';

// Create your first component
function Counter() {
  const [count, setCount] = useState('counter', 0);

  // Update every frame (typically 60fps)
  useFrameUpdate((dt) => {
    setCount(prev => prev + dt); // Count seconds
    console.log(`Time elapsed: ${count.toFixed(1)}s`);
  });

  // Update at fixed rate (consistent 60Hz)
  useFixedUpdate((dt) => {
    // Perfect for physics or consistent game logic
    console.log(`Fixed update: ${dt.toFixed(4)}s delta`);
  });
}

// Create a world and mount your component
const world = new World();
world.mount(Counter);

// Start the simulation
world.start();
```

That's it! You now have a running Pulse application with both frame-based and fixed-timestep updates. Pulse handles all the timing and scheduling for you.

## Why Pulse?

### 🎯 **Composability First**
Build complex behaviors from simple, reusable pieces. Each component does one thing well.

### ⚡ **Performance Focused**
- **Fixed timestep** physics with frame interpolation for smooth visuals
- **Efficient scene graph** with cached world-space calculations
- **Minimal allocations** and smart caching strategies

### 🏗️ **Modular Architecture**
- **Core package** with essential ECS primitives
- **Extension packages** for specific domains (input, networking, rendering)
- **Plugin system** for custom integrations

### 🎨 **React-Inspired API**
- **Functional components** with hooks for logic
- **Declarative composition** of game objects
- **Automatic cleanup** and lifecycle management

## Core Concepts

Pulse is built around a few key concepts that work together:

### 🌍 **World**
The container for everything in your application. Manages the scene graph, update loops, and global state.

### 🏷️ **Nodes**
The entities in your scene graph. Every game object is a Node with a unique ID and position in the hierarchy.

### 🧩 **Components**
Data attached to Nodes. Transform, physics properties, render state - everything is a component.

### ⚙️ **Systems**
Logic that operates on components. Physics, rendering, AI - all run as systems.

### 🔧 **Services**
Singleton utilities and managers. Input handling, asset loading, networking.

## Learn More

Dive deeper into Pulse with our comprehensive guides:

- **[Getting Started](docs/getting-started.md)** - Complete setup and first project
- **[Core Concepts](docs/core-concepts.md)** - Understanding World, Nodes, and Components
- **[Scene Graph](docs/scene-graph.md)** - Building hierarchical game objects
- **[Functional Components](docs/functional-components.md)** - React-style composition with hooks
- **[Update System](docs/update-system.md)** - Fixed timestep physics and frame updates
- **[Examples](docs/examples.md)** - Real-world patterns and recipes

## Architecture

```
@pulse-ts/core          # Essential ECS primitives
├── World              # Main application container
├── Node               # Scene graph entities
├── Component          # Data attached to nodes
├── System             # Logic operating on components
├── Service            # Singleton utilities
└── FC (Functional)    # React-style components

Extension Packages
├── @pulse-ts/input    # Input handling and bindings
├── @pulse-ts/network  # Multiplayer and networking
├── @pulse-ts/save     # Serialization and persistence
└── @pulse-ts/three    # Three.js rendering integration
```

---

Ready to build something amazing? Let's get started with Pulse!
