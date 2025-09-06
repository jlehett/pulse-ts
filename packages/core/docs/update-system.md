# Update System & Ticks

Pulse's **update system** manages time and provides multiple update loops for different types of game logic. Understanding the timing system is crucial for smooth gameplay and consistent physics.

## Update Kinds

Pulse provides two main types of updates:

### Fixed Updates
- **Consistent timing** - Runs at a fixed rate (default 60Hz)
- **Physics & simulation** - Perfect for consistent gameplay mechanics
- **Network synchronization** - Deterministic across different frame rates

### Frame Updates
- **Variable timing** - Runs every rendered frame
- **Animation & rendering** - Adapts to display refresh rate
- **Input handling** - Responsive to user input

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

## Performance Considerations

### Update Order Matters

```typescript
function PerformanceTips() {
  // ✅ Good: Early phases for input/physics setup
  useFixedEarly((dt) => {
    sampleInput();
    preparePhysics();
  });

  // ✅ Good: Core logic in update phase
  useFixedUpdate((dt) => {
    runPhysics();
    updateAI();
  });

  // ✅ Good: Cleanup in late phase
  useFixedLate((dt) => {
    applyConstraints();
    cleanup();
  });
}
```

### Batching Updates

```typescript
function BatchedUpdates() {
  const [pendingUpdates, setPendingUpdates] = useState('updates', []);

  // Collect updates instead of processing immediately
  useFrameUpdate((dt) => {
    setPendingUpdates(prev => [...prev, { type: 'move', dx: 1 }]);
  });

  // Process in batches
  useFixedUpdate((dt) => {
    for (const update of pendingUpdates) {
      applyUpdate(update);
    }
    setPendingUpdates([]);
  });
}
```

### Tick Management

```typescript
function TickManagement() {
  // Disable expensive ticks when not needed
  const [isVisible, setIsVisible] = useState('visible', true);

  useFrameUpdate(() => {
    if (!isVisible) {
      world.setNodeTicksEnabled(useNode(), false);
    }
  });

  // Re-enable when needed
  useInit(() => {
    const observer = new IntersectionObserver((entries) => {
      setIsVisible(entries[0].isIntersecting);
      world.setNodeTicksEnabled(useNode(), entries[0].isIntersecting);
    });
    // ... setup observer
  });
}
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

### Delta Time Management

```typescript
function DeltaTimeHandling() {
  // Handle variable delta times
  useFrameUpdate((dt) => {
    // Clamp large delta times (e.g., from tab switching)
    const clampedDt = Math.min(dt, 1/30); // Max 30fps equivalent

    // Use clamped delta for smooth animation
    animationProgress += clampedDt * animationSpeed;
  });

  // Accumulate small delta times for precision
  useFrameUpdate((dt) => {
    timeAccumulator += dt;

    while (timeAccumulator >= fixedDt) {
      updateLogic(fixedDt);
      timeAccumulator -= fixedDt;
    }
  });
}
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

## Common Patterns

### Game Loop Structure

```typescript
function GameLoop() {
  // Early: Input and preparation
  useFixedEarly((dt) => {
    sampleInput();
    updateCamera();
  });

  // Update: Core game logic
  useFixedUpdate((dt) => {
    updatePhysics();
    updateAI();
    checkCollisions();
  });

  // Late: Post-processing
  useFixedLate((dt) => {
    applyDamage();
    updateScore();
  });

  // Frame updates: Visual feedback
  useFrameUpdate((dt) => {
    updateAnimations();
    updateParticles();
    render();
  });
}
```

### Multiplayer Timing

```typescript
function MultiplayerGame() {
  // Fixed updates for deterministic simulation
  useFixedUpdate((dt) => {
    // Apply authoritative server state
    applyServerState();

    // Run local prediction
    runPrediction();

    // Reconcile with server (if needed)
    reconcileWithServer();
  });

  // Frame updates for smooth rendering
  useFrameUpdate((dt) => {
    // Interpolate between server states
    const interpolatedState = interpolateServerStates();

    // Render interpolated state
    renderGameState(interpolatedState);
  });
}
```

### Time-Based Effects

```typescript
function TimeEffects() {
  const [timeScale, setTimeScale] = useState('timeScale', 1);

  // Slow motion effect
  const triggerSlowMotion = () => {
    setTimeScale(0.2);
    setTimeout(() => setTimeScale(1), 2000);
  };

  useFrameUpdate(() => {
    world.setTimeScale(timeScale);
  });

  // Time dilation for specific objects
  useFixedUpdate((dt) => {
    // Apply time dilation to this object's updates
    const dilatedDt = dt * timeScale;
    updateObjectLogic(dilatedDt);
  });
}
```

The update system is the heartbeat of your Pulse application. Fixed updates provide consistency for physics and logic, while frame updates ensure smooth visuals. Use the right tool for each job, and your game will run smoothly across different hardware and frame rates!
