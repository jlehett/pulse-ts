# @pulse-ts/core

The core runtime for Pulse TS, a modular TypeScript game engine built for real-time, interactive applications.

```bash
npm install @pulse-ts/core
```

## What is Pulse?

Pulse is an **Entity Component System (ECS)** framework designed specifically for building interactive applications. Think of it as React meets game development - you compose your app from small, focused pieces that work together seamlessly.

Unlike traditional game engines, Pulse embraces **composability** and **modularity**. You can build complex behaviors by combining simple components, and extend the engine with custom packages for your specific needs.

## Quick Start

Pulse is an Entity Component System (ECS) framework that helps you build interactive applications. At its core, Pulse manages:

- **Timing**: Separate fixed and frame-based updates for consistent behavior
- **Hierarchy**: Parent-child relationships between objects
- **State**: Persistent data storage and lifecycle management
- **Composition**: Building complex behavior from simple parts

Let's start with a simple example that demonstrates these concepts:

```typescript
import { World, mount } from '@pulse-ts/core';

function MyApp() {
  // This creates a Node in the scene
  console.log('Application started!');
}

// Create a world and add your application
const world = new World();
world.mount(MyApp);
world.start();
```

This creates a running Pulse application. The `MyApp` function is a **functional node** that creates a **Node** - the basic building block in Pulse's scene graph.

## Why Pulse?

### 🎯 **Composability First**
Build complex applications by composing simple, focused pieces. Each piece does one thing well and can be combined with others.

### ⚡ **Performance Focused**
- **Predictable timing** with separate fixed and frame updates
- **Efficient scene graph** with cached spatial calculations
- **Minimal allocations** through smart state management

### 🏗️ **Modular Architecture**
- **Core package** with essential ECS primitives
- **Extension packages** for specific domains
- **Composable systems** for custom integrations

### 🎨 **React-Inspired Patterns**
- **Functional nodes** for declarative composition
- **Hooks** for managing state and side effects
- **Automatic lifecycle management**

## Core Concepts

Pulse is built around a few fundamental concepts:

### 🌍 **World**
The container that manages your entire application. It coordinates timing, maintains the scene hierarchy, and provides services.

### 🏷️ **Nodes**
The entities in your scene graph. Every object in your application is a Node with a unique identity and position in the hierarchy.

### 🧩 **Components**
Data attached to Nodes. Components describe what properties an object has (like position, rotation, or custom state).

### ⚙️ **Systems**
Logic that operates on components. Systems process groups of components to create behavior.

### 🔧 **Services**
Singleton utilities and managers that provide global functionality.

## Learn More

Dive deeper into Pulse with our comprehensive guides:

- **[Getting Started](docs/getting-started.md)** - Complete setup and first project
- **[Core Concepts](docs/core-concepts.md)** - Understanding World, Nodes, and Components
- **[Scene Graph](docs/scene-graph.md)** - Building hierarchical objects
- **[Functional Nodes](docs/functional-nodes.md)** - Node creation with hooks
- **[Update System](docs/update-system.md)** - Understanding timing and updates
- **[Examples](docs/examples.md)** - Real-world patterns and recipes


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
- **[Functional Components](docs/functional-nodes.md)** - React-style composition with hooks
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
