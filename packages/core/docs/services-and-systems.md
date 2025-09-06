# Systems & Services

Systems are update-time behaviors attached to the `World`. Services are singletons that expose functionality to systems and game code.

## Services

Create a service by extending `Service` and provide it to the world:

```ts
import { Service, World } from '@pulse-ts/core';

class ScoreService extends Service {
  private score = 0;
  add(n: number) { this.score += n; }
  get() { return this.score; }
}

const world = new World();
world.provideService(new ScoreService());

const score = world.getService(ScoreService)!;
console.log(score.get());
world.removeService(ScoreService);
```

Built-in services:

- `StatsService`: `world.getService(StatsService)?.get()` returns `{ fps, fixedSps, frameId }`.
- `CullingCamera`: provides a camera projection-view matrix used by the culling system.

```ts
import { CullingCamera } from '@pulse-ts/core';
const projView = new Float32Array(16); // fill with your camera PV (column-major)
world.provideService(new CullingCamera(projView));
```

## Systems

Create a system by extending `System`. Systems auto-register a tick with optional static configuration:

```ts
import { System } from '@pulse-ts/core';

class SpinSystem extends System {
  static updateKind = 'frame'; // 'fixed' by default
  static updatePhase = 'update'; // 'update' by default
  static order = 0; // lower runs first

  update(dt: number) {
    // read services, iterate nodes, etc.
  }
}

world.addSystem(new SpinSystem());
// world.getSystem(SpinSystem);
// world.removeSystem(SpinSystem);
```

Built-in system:

- `CullingSystem`: frustum-culls nodes based on their `Bounds` against the `CullingCamera` service and writes `Visibility.visible`.

Usage:

```ts
import { Bounds, Visibility, CullingCamera } from '@pulse-ts/core';

// Provide camera PV matrix
world.provideService(new CullingCamera(myProjViewMatrix));

// Mark nodes with bounds; the system ensures a Transform exists
attachComponent(n, Bounds).setLocal(min, max);

// On each frame, CullingSystem will set Visibility.visible accordingly
```

