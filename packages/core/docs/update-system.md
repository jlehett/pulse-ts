# Update System & Ticks

Pulse's **update system** manages time and provides multiple update loops for different types of application logic. This dual timing system is one of Pulse's most important features.

**Why multiple update types?** Interactive applications have different timing needs. Some logic needs to be consistent regardless of frame rate, while other logic should adapt to the display rate. Pulse separates these concerns.

## Update Kinds

Pulse provides two main types of updates:

### Fixed Updates
- **Consistent timing** - Runs at a fixed rate (default 60Hz)
- **Physics & simulation** - Perfect for consistent gameplay mechanics
- **Network synchronization** - Deterministic across different frame rates

**When to use fixed updates:** Any logic that needs to be consistent and predictable. Examples:
- Physics calculations (gravity, collisions)
- Game state updates (scores, timers)
- AI decision making
- Networked game logic

### Frame Updates
- **Variable timing** - Runs every rendered frame
- **Animation & rendering** - Adapts to display refresh rate
- **Input handling** - Responsive to user input

**When to use frame updates:** Logic that can vary with frame rate. Examples:
- Visual animations
- UI updates
- Camera movement
- Particle effects

**Real-world example:** Imagine you're building a platformer game. You want the player character's jump physics to feel the same on a high-end gaming PC (running at 144fps) as on a older laptop (running at 30fps). Fixed updates ensure this consistency. But you might want visual effects like particle trails to look smoother on faster computers - that's where frame updates shine.

```typescript
function GameObject() {
  // Fixed update (60Hz, consistent)
  useFixedUpdate((dt) => {
    // Physics, collision detection, AI
    position += velocity * dt;
  });

  // Frame update (varies with framerate)
  useFrameUpdate((dt) => {
    // Animation, rendering, UI updates
    animationFrame += dt;
  });
}
```

## Update Phases

Each update kind has three phases that run in order:

```
Early → Update → Late
```

### Phase Timing
```typescript
function UpdatePhases() {
  // Fixed timestep phases
  useFixedEarly((dt) => {
    // Input sampling, pre-physics
  });

  useFixedUpdate((dt) => {
    // Core physics, collision
  });

  useFixedLate((dt) => {
    // Post-physics adjustments
  });

  // Frame-based phases
  useFrameEarly((dt) => {
    // Input processing, camera updates
  });

  useFrameUpdate((dt) => {
    // Animation, particle updates
  });

  useFrameLate((dt) => {
    // Rendering, cleanup
  });
}
```

## Timing Configuration

### World Timing Options

```typescript
const world = new World({
  // Fixed timestep in milliseconds (default: ~16.67ms = 60Hz)
  fixedStepMs: 1000 / 60,

  // Max fixed steps per frame (prevents spiral of death)
  maxFixedStepsPerFrame: 8,

  // Max frame delta time (clamps large gaps)
  maxFrameDtMs: 250,
});
```

### Runtime Timing Control

```typescript
// Time scaling
world.setTimeScale(0.5);    // Slow motion
world.setTimeScale(2.0);    // Fast forward
world.setTimeScale(0);      // Pause (but see below)

// Pause/resume
world.pause();
world.resume();
world.isPaused(); // Check state
```

## Fixed vs Frame Updates

### When to Use Fixed Updates

```typescript
function PhysicsObject() {
  const transform = useComponent(Transform);
  let velocity = { x: 0, y: 0 };

  useFixedUpdate((dt) => {
    // ✅ Consistent physics regardless of framerate
    velocity.y -= 9.81 * dt; // Gravity
    transform.localPosition.x += velocity.x * dt;
    transform.localPosition.y += velocity.y * dt;

    // ✅ Deterministic multiplayer
    // ✅ Consistent collision detection
    // ✅ Stable AI decision making
  });
}
```

### When to Use Frame Updates

```typescript
function VisualEffect() {
  const [animationTime, setAnimationTime] = useState('animTime', 0);

  useFrameUpdate((dt) => {
    // ✅ Smooth animation at any framerate
    setAnimationTime(prev => prev + dt);

    // ✅ Responsive UI updates
    // ✅ Particle systems
    // ✅ Camera following
  });
}
```

## Interpolation for Smooth Rendering

Pulse automatically interpolates between fixed physics frames:

```typescript
function SmoothRenderer() {
  const transform = useComponent(Transform);

  // Physics at 60Hz
  useFixedUpdate((dt) => {
    transform.localPosition.x += 1 * dt; // Move 60 units/second
  });

  // Rendering sees smooth motion
  useFrameUpdate(() => {
    // At 120fps, this position is interpolated
    const smoothPosition = transform.worldPosition;
    renderAt(smoothPosition);
  });
}
```

### Manual Interpolation

```typescript
function CustomInterpolation() {
  const transform = useComponent(Transform);
  const [previousPos, setPreviousPos] = useState('prevPos', new Vec3());

  useFixedUpdate(() => {
    // Store previous position before physics
    setPreviousPos(transform.localPosition.clone());

    // Apply physics
    transform.localPosition.x += velocity.x;
  });

  useFrameUpdate(() => {
    // Manual interpolation for custom effects
    const alpha = world.getAmbientAlpha(); // 0-1 between physics frames
    const currentPos = transform.localPosition;

    const interpolatedPos = Vec3.lerp(
      previousPos,
      currentPos,
      alpha
    );

    renderAt(interpolatedPos);
  });
}
```

## Tick Registration

### Component-Level Ticks

```typescript
function CustomTicks() {
  const transform = useComponent(Transform);

  // Register custom update functions
  const tick = useFixedUpdate((dt) => {
    transform.localPosition.x += 1 * dt;
  });

  // Control tick execution
  useInit(() => {
    // Pause this specific tick
    world.setNodeTicksEnabled(useNode(), false);

    // Resume later
    setTimeout(() => {
      world.setNodeTicksEnabled(useNode(), true);
    }, 2000);
  });
}
```

### System-Level Ticks

```typescript
class PhysicsSystem extends System {
  update(dt: number) {
    // System-level fixed update
    for (const node of this.world.nodes) {
      // Process physics for all nodes
    }
  }
}

// Register system ticks
const physicsTick = world.registerSystemTick(
  'fixed',    // kind
  'update',   // phase
  (dt) => physicsSystem.update(dt),
  100         // order (higher = later)
);
```

## Advanced Timing

### Custom Schedulers

```typescript
// Custom scheduler for testing
class TestScheduler implements Scheduler {
  schedule(callback: () => void) {
    // Immediate execution for tests
    callback();
  }

  unschedule() {
    // No-op for tests
  }
}

const world = new World({
  scheduler: new TestScheduler()
});
```

## Debugging Timing

### Performance Stats

```typescript
function PerformanceMonitor() {
  useFrameUpdate(() => {
    const stats = world.debugStats();

    console.log(`FPS: ${stats.fps}`);
    console.log(`Fixed SPS: ${stats.fixedSps}`);
    console.log(`Nodes: ${stats.nodes}`);
    console.log(`Active ticks: ${stats.ticks}`);
  });
}
```

### Timing Visualization

```typescript
function TimingDebugger() {
  const [frameTimes, setFrameTimes] = useState('frameTimes', []);
  const [fixedTimes, setFixedTimes] = useState('fixedTimes', []);

  useFrameUpdate((dt) => {
    setFrameTimes(prev => [...prev.slice(-59), dt * 1000]);
  });

  useFixedUpdate((dt) => {
    setFixedTimes(prev => [...prev.slice(-59), dt * 1000]);
  });

  // Visualize timing graphs
  useFrameUpdate(() => {
    const avgFrame = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
    const avgFixed = fixedTimes.reduce((a, b) => a + b, 0) / fixedTimes.length;

    console.log(`Avg frame time: ${avgFrame.toFixed(2)}ms`);
    console.log(`Avg fixed time: ${avgFixed.toFixed(2)}ms`);
  });
}
```