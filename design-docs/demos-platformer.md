# Design Doc: `demos/` Directory & Platformer Demo

## Overview

Add a `demos/` top-level directory to house runnable example apps that exercise
multiple Pulse packages together. Each demo is a standalone Vite app in its own
subdirectory, linked to `@pulse-ts/*` packages via workspaces.

The first demo is a **3D platformer** — a player-controlled character navigating
platforms, jumping, and collecting items. It exercises **core**, **input**,
**physics**, and **three**.

---

## 1. `demos/` Infrastructure

### Workspace Setup

Add `demos/*` to the root `package.json` workspaces array:

```jsonc
"workspaces": ["packages/*", "demos/*"]
```

### Per-Demo Structure

```
demos/
  platformer/
    index.html          // Vite entry
    src/
      main.ts           // World setup, installers, mount root FC
      nodes/            // Functional components (player, platform, camera, etc.)
      config/           // Constants, input bindings, level data
    package.json        // name: "@pulse-ts/demo-platformer", private: true
    tsconfig.json
    vite.config.ts
```

Each demo:
- Is `private: true` (never published to npm).
- Uses Vite for dev server + HMR.
- Depends on `@pulse-ts/*` workspace packages.
- Has a `dev` script (`vite`) and a `build` script (`vite build`).

### Root Scripts

Add convenience scripts to root `package.json`:

```jsonc
"scripts": {
  "demo:platformer": "npm run dev -w demos/platformer"
}
```

---

## 2. Platformer Demo Design

### Concept

A simple 3D platformer where the player moves a character across floating
platforms, jumps between them, and collects items. The camera follows the player.

**Goal:** Demonstrate practical usage of Pulse's core ECS, input bindings,
physics simulation, and Three.js rendering working together.

### Packages Used

| Package | Role |
|---------|------|
| `@pulse-ts/core` | World, FC nodes, Transform, hooks, update loop |
| `@pulse-ts/input` | Keyboard bindings for movement and jump |
| `@pulse-ts/physics` | Rigid bodies, colliders, gravity, collision events |
| `@pulse-ts/three` | Three.js rendering, mesh attachment, camera |

### Functional Components (Nodes)

#### `PlayerNode`
- **RigidBody**: dynamic, capsule collider
- **Input**: `useAction('jump')`, `useAxis2D('move')` (WASD / arrow keys)
- **Movement**: On `useFixedUpdate`, read input axes and apply horizontal
  velocity. On jump action pressed + grounded, apply upward impulse.
- **Ground detection**: Raycast downward from player center; short distance =
  grounded.
- **Rendering**: Attach a simple Three.js mesh (capsule or box geometry + color
  material).

#### `PlatformNode`
- **Props**: `{ position, size }`
- **RigidBody**: static, box collider sized to match
- **Rendering**: Box mesh with a distinct material/color.

#### `CollectibleNode`
- **Props**: `{ position }`
- **RigidBody**: static, sphere collider, `isTrigger: true`
- **Behavior**: On `useOnCollisionStart` with player, remove self (node
  destroy) and increment score.
- **Rendering**: Small rotating sphere or gem-like shape.

#### `CameraRigNode`
- **Behavior**: On `useFrameUpdate`, lerp camera position to follow the
  player's transform with an offset (e.g., behind and above).
- **Rendering**: Sets the Three.js camera position/rotation.

#### `LevelNode` (root)
- Mounts `PlayerNode`, multiple `PlatformNode` instances via `useChild`, a
  set of `CollectibleNode` instances, and `CameraRigNode`.
- Level layout defined in a config file (array of platform positions/sizes).

#### `HudNode` (stretch goal)
- Simple HTML overlay for score display, not part of first pass.

### Input Bindings

```ts
const bindings = {
  move: Axis2D({
    x: Axis1D({ pos: Key('KeyD'),    neg: Key('KeyA') }),
    y: Axis1D({ pos: Key('KeyW'),    neg: Key('KeyS') }),
  }),
  jump: Key('Space'),
};
```

### Level Config

A simple array of platform definitions:

```ts
const level = {
  platforms: [
    { position: [0, 0, 0],     size: [4, 0.5, 4] },   // starting platform
    { position: [6, 1, 0],     size: [3, 0.5, 3] },   // slightly higher
    { position: [12, 2.5, 0],  size: [3, 0.5, 3] },   // jump up
    // ...
  ],
  collectibles: [
    { position: [6, 2.5, 0] },
    { position: [12, 4, 0] },
  ],
  playerSpawn: [0, 2, 0],
};
```

### World Setup (`main.ts`)

```ts
import { World, installDefaults } from '@pulse-ts/core';
import { installInput } from '@pulse-ts/input';
import { installPhysics } from '@pulse-ts/physics';
import { installThree } from '@pulse-ts/three';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const world = new World();

installDefaults(world);
installInput(world, { bindings });
installPhysics(world, { gravity: [0, -20, 0] });
installThree(world, { canvas });

world.mount(LevelNode);
world.start();
```

### Physics Tuning

- Gravity: `[0, -20, 0]` (slightly stronger than default for snappier jumps).
- Player capsule: radius 0.3, half-height 0.5.
- Jump impulse: tuned to feel responsive (~8-10 upward).
- Horizontal speed: direct velocity set, not force-based, for tight controls.
- Platforms: static rigid bodies with box colliders.

### Visual Style

Minimal — colored geometry, no textures. Clean look that focuses on
demonstrating the engine rather than art:

- **Player**: bright color capsule/box
- **Platforms**: muted gray/blue boxes
- **Collectibles**: small yellow rotating spheres
- **Background**: dark clear color
- **Lighting**: single directional light + ambient

---

## 3. Scope & Non-Goals

### In Scope
- Working platformer with movement, jumping, collectibles.
- Clean FC-based architecture demonstrating Pulse patterns.
- Level config driven layout.
- Camera follow.

### Out of Scope (for first pass)
- Sound/audio.
- Enemies or hazards.
- Multiple levels or level transitions.
- Save/load.
- Networking.
- UI framework (score can be a simple DOM element).
- Mobile/touch input.

---

## 4. Decisions

1. **Player respawn**: Death plane below the level resets the player to spawn.
2. **Score display**: Skipped for first pass.
3. **Visual style**: Simple but aesthetically pleasing — clean colors, good
   lighting, no textures.
