# Getting Started

Welcome to Pulse! This guide will help you understand the fundamental concepts and get started with your first application.

## What is Pulse?

Pulse is an **Entity Component System (ECS)** framework designed for building interactive applications. Unlike traditional object-oriented approaches, ECS separates:

- **Data** (Components) from
- **Logic** (Systems) from
- **Identity** (Nodes)

This separation makes your code more modular, testable, and performant.

## Core Concepts

Before writing code, let's understand Pulse's fundamental building blocks:

### 🌍 The World
The World is the root container for everything in your Pulse application. It manages:
- The scene hierarchy (parent-child relationships)
- Update timing and scheduling
- Global services and systems
- Component registration

Think of the World as your application's "universe" - everything exists within it.

### 🏷️ Nodes
Nodes are the entities in your scene graph. Every object in your application is a Node. Nodes:
- Have a unique identity
- Can form parent-child relationships
- Can have data attached via components
- Participate in the update cycle

### 🧩 Components
Components are pure data structures attached to Nodes. They describe what properties a Node has:
- Position and rotation (Transform component)
- Custom state (your own components)
- Configuration data

Components are just data - they don't contain logic.

### ⚙️ Systems
Systems contain the logic that operates on components. They:
- Run automatically as part of the World's update cycle
- Process groups of components to create behavior
- Are optimized for performance

### 🔧 Services
Services are singleton utilities that provide global functionality:
- Statistics tracking
- Event management
- Resource management

## Understanding Updates

One of Pulse's most important concepts is its dual update system:

### Frame Updates
- Run every rendered frame (typically 60 times per second)
- Timing varies based on frame rate
- Good for: Animation, UI updates, visual effects

### Fixed Updates
- Run at a consistent rate (default 60Hz)
- Timing is always the same
- Good for: Physics, game logic, AI decisions

**Why separate updates?** In interactive applications, you want some things (like physics) to be consistent regardless of frame rate, while other things (like animations) should adapt to the display rate.

## Functional Nodes

Pulse uses **functional nodes** to create Nodes. These are functions that:
- Create a Node in the scene
- Use hooks to manage state and side effects
- Can create child Nodes
- Have a lifecycle (initialization and cleanup)

## Your First Steps

1. **Install Pulse**: Add `@pulse-ts/core` to your project
2. **Create a World**: The container for your application
3. **Write functional nodes**: Functions that create Nodes
4. **Add state and behavior**: Use hooks for data and updates
5. **Start the world**: Call `world.start()` to begin

## Next Steps

Now that you understand the fundamentals:

- **[Core Concepts](core-concepts.md)** - Deep dive into World, Nodes, and Components
- **[Functional Nodes](functional-nodes.md)** - Node creation with hooks
- **[Update System](update-system.md)** - Understanding timing in detail
- **[Scene Graph](scene-graph.md)** - Building object hierarchies
- **[Examples](examples.md)** - Practical patterns to follow

Remember: Pulse is about composition and separation of concerns. Start simple, then combine pieces to build complex behavior!
