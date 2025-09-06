# @pulse-ts/core

The core runtime for Pulse TS, a modular TypeScript game engine built for real-time, interactive applications.

```bash
npm install @pulse-ts/core
```

## What is Pulse?

Pulse is an **Entity Component System (ECS)** framework designed specifically for building interactive applications. Think of it as React meets game development - you compose your app from small, focused pieces that work together seamlessly.

Unlike traditional game engines, Pulse embraces **composability** and **modularity**. You can build complex behaviors by combining simple components, and extend the engine with custom packages for your specific needs.

## Quick Start

Let's build your first Pulse app - a simple bouncing ball:

```typescript
import { World, mount } from '@pulse-ts/core';

// Create your first component
function BouncingBall() {
  const transform = useComponent(Transform);

  // Run physics every frame
  useFrameUpdate((dt) => {
    // Simple gravity and bounce
    transform.localPosition.y -= 9.81 * dt;

    if (transform.localPosition.y < 0) {
      transform.localPosition.y = 0;
      // Bounce with energy loss
      // (We'll add velocity in the next step!)
    }
  });
}

// Create a world and mount your component
const world = new World();
world.mount(BouncingBall);

// Start the simulation
world.start();
```

That's it! You now have a basic physics simulation running. Pulse handles the timing, updates, and scene management for you.

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

## Performance Philosophy

Pulse is designed for **real-time applications** with these principles:

- **Predictable timing** - Fixed timestep physics with interpolation
- **Minimal GC pressure** - Object pooling and reuse strategies
- **Efficient queries** - Fast component iteration and spatial queries
- **Scalable architecture** - Handle thousands of entities smoothly

## Community & Support

- 📖 **[Documentation](docs/)** - Comprehensive guides and API reference
- 💬 **Discord** - Community chat and support
- 🐛 **GitHub Issues** - Bug reports and feature requests
- 📧 **Newsletter** - Updates and release announcements

---

Ready to build something amazing? Let's get started with Pulse!
