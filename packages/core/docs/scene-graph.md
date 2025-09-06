# Scene Graph & Transforms

Pulse's **scene graph** manages the spatial relationships between game objects. Every Node can have a position, rotation, and scale, and these properties inherit through the hierarchy - just like in 3D modeling software.

## Understanding Transforms

Every Node can have a **Transform** component that defines its position, rotation, and scale in 3D space.

```typescript
import { Transform, createTRS } from '@pulse-ts/core';

function MyObject() {
  const transform = useComponent(Transform);

  // Position (relative to parent)
  transform.localPosition.set(1, 2, 3);

  // Rotation (in radians, relative to parent)
  transform.localRotation.set(0, Math.PI/2, 0);

  // Scale (relative to parent)
  transform.localScale.set(2, 1, 1);
}
```

## Local vs World Space

Pulse uses a **hierarchical coordinate system**:

- **Local Space** - Position/rotation/scale relative to the parent
- **World Space** - Absolute position/rotation/scale in the scene

```typescript
function Spaceship() {
  const transform = useComponent(Transform);

  // Local properties (relative to parent)
  transform.localPosition.x = 5;  // 5 units right of parent
  transform.localRotation.y = Math.PI/4;  // 45° rotation

  // World properties (absolute in scene)
  const worldPos = transform.worldPosition;    // Vec3
  const worldRot = transform.worldRotation;    // Quat
  const worldScale = transform.worldScale;     // Vec3
}
```

## Building Hierarchies

Parent-child relationships create transform hierarchies:

```typescript
function SpaceshipWithParts() {
  // Ship body
  const transform = useComponent(Transform);
  transform.localPosition.set(0, 0, 0);

  // Engine (child of ship)
  const engine = useChild(Engine);
  engine.getComponent(Transform).localPosition.set(0, -2, 1);

  // Wing (child of ship)
  const wing = useChild(Wing);
  wing.getComponent(Transform).localPosition.set(3, 0, 0);
}

function Engine() {
  const transform = useComponent(Transform);
  // Position is relative to spaceship
  transform.localPosition.set(0, -2, 1);
}

function Wing() {
  const transform = useComponent(Transform);
  // Position is relative to spaceship
  transform.localPosition.set(3, 0, 0);
}
```

## Transform Operations

### Direct Position/Rotation/Scale

```typescript
function MovingObject() {
  const transform = useComponent(Transform);

  useFrameUpdate((dt) => {
    // Move forward
    transform.localPosition.z += 5 * dt;

    // Rotate around Y axis
    transform.localRotation.y += Math.PI * dt;

    // Scale up and down
    const scale = 1 + Math.sin(Date.now() * 0.001);
    transform.localScale.set(scale, scale, scale);
  });
}
```

### Transform Utilities

```typescript
function TransformExample() {
  const transform = useComponent(Transform);

  // Set position, rotation, scale at once
  transform.setLocal({
    position: { x: 1, y: 2, z: 3 },
    rotationQuat: Quat.fromEuler(0, Math.PI/2, 0),
    scale: { x: 2, y: 1, z: 1 }
  });

  // Edit with a function (batches dirty marking)
  transform.editLocal((t) => {
    t.localPosition.x += 1;
    t.localRotation.y += 0.1;
    t.localScale.x *= 1.1;
  });

  // Get interpolated values (for smooth rendering)
  const currentTRS = transform.getLocalTRS(undefined, 0.5);
  const worldTRS = transform.getWorldTRS(undefined, 0.5);
}
```

## Interpolation & Smoothing

Pulse automatically **interpolates** between physics frames for smooth visuals:

```typescript
function PhysicsObject() {
  const transform = useComponent(Transform);

  // Physics runs at fixed 60Hz
  useFixedUpdate((dt) => {
    transform.localPosition.y -= 9.81 * dt; // Gravity
  });

  // Rendering sees smooth interpolation
  useFrameUpdate(() => {
    const smoothPosition = transform.worldPosition;
    // This position is interpolated between physics frames
    renderAt(smoothPosition);
  });
}
```

## Common Patterns

### Character with Multiple Parts

```typescript
function Character() {
  // Character root
  const transform = useComponent(Transform);

  // Body (at character position)
  const body = useChild(Body);

  // Head (relative to body)
  const head = useChild(Head);
  head.getComponent(Transform).localPosition.y = 1.8;

  // Arms (relative to body)
  const leftArm = useChild(Arm, { side: 'left' });
  leftArm.getComponent(Transform).localPosition.set(-0.5, 1.5, 0);

  const rightArm = useChild(Arm, { side: 'right' });
  rightArm.getComponent(Transform).localPosition.set(0.5, 1.5, 0);
}
```

### Orbital Mechanics

```typescript
function PlanetSystem() {
  const transform = useComponent(Transform);

  // Sun at center
  const sun = useChild(Sun);

  // Planets orbiting sun
  const earth = useChild(Planet, { distance: 10, speed: 1 });
  const mars = useChild(Planet, { distance: 15, speed: 0.8 });
}

function Planet({ distance, speed }: { distance: number; speed: number }) {
  const transform = useComponent(Transform);
  let angle = 0;

  useFrameUpdate((dt) => {
    angle += speed * dt;
    transform.localPosition.x = Math.cos(angle) * distance;
    transform.localPosition.z = Math.sin(angle) * distance;
  });
}
```

### Camera Following Player

```typescript
function CameraRig() {
  const transform = useComponent(Transform);

  // Camera follows player with offset
  const camera = useChild(Camera);
  camera.getComponent(Transform).localPosition.set(0, 5, -10);

  // Look at player
  useFrameUpdate(() => {
    const playerPos = getPlayerPosition();
    transform.localPosition.lerp(playerPos, 0.1); // Smooth follow
  });
}
```

## Transform Math

Pulse includes optimized math utilities:

```typescript
import { Vec3, Quat } from '@pulse-ts/core';

function TransformMath() {
  const transform = useComponent(Transform);

  // Vector operations
  const forward = new Vec3(0, 0, 1);
  const right = new Vec3(1, 0, 0);
  const up = new Vec3(0, 1, 0);

  // Rotate vector by quaternion
  const rotatedForward = Quat.rotateVector(transform.localRotation, forward);

  // Distance between points
  const distance = Vec3.distance(transform.worldPosition, targetPosition);

  // Direction to target
  const direction = Vec3.subtract(targetPosition, transform.worldPosition);
  Vec3.normalize(direction, direction);

  // Move towards target
  const speed = 5;
  transform.localPosition.add(Vec3.multiply(direction, speed * dt));
}
```

## Performance Considerations

### Transform Updates

```typescript
function EfficientTransforms() {
  const transform = useComponent(Transform);

  // ✅ Good: Batch updates
  transform.editLocal((t) => {
    t.localPosition.x += 1;
    t.localPosition.y += 1;
    t.localRotation.y += 0.1;
  });

  // ❌ Bad: Multiple separate updates (dirties transform 3 times)
  transform.localPosition.x += 1;
  transform.localPosition.y += 1;
  transform.localRotation.y += 0.1;
}
```

### Hierarchy Depth

```typescript
// ✅ Good: Shallow hierarchies
World
├── Player
│   ├── Body
│   ├── Head
│   └── Arms
└── Enemies
    ├── Enemy1
    ├── Enemy2
    └── Enemy3

// ❌ Bad: Deep hierarchies (slow world-space calculations)
World
├── Level
│   ├── Region1
│   │   ├── Area1
│   │   │   ├── Room1
│   │   │   │   ├── Objects...
```

### Caching World Transforms

```typescript
function CachedWorldTransform() {
  const transform = useComponent(Transform);

  // World transform is cached and only recalculated when local changes
  useFrameUpdate(() => {
    const worldPos = transform.worldPosition; // Fast cached lookup
    const worldRot = transform.worldRotation; // Fast cached lookup
  });
}
```

## Advanced Techniques

### Inverse Kinematics (Simple)

```typescript
function ArmIK() {
  const shoulder = useComponent(Transform);
  const elbow = useChild(Elbow);
  const hand = useChild(Hand);

  useFrameUpdate(() => {
    const target = getTargetPosition();

    // Simple 2-bone IK
    const shoulderToTarget = Vec3.subtract(target, shoulder.worldPosition);
    const armLength = 5; // shoulder to elbow + elbow to hand

    // Position elbow to reach target
    const elbowPos = Vec3.multiply(
      Vec3.normalize(shoulderToTarget),
      armLength * 0.5
    );
    elbow.getComponent(Transform).localPosition.copy(elbowPos);
  });
}
```

### Transform Gizmos

```typescript
function TransformGizmo() {
  const transform = useComponent(Transform);

  // X axis handle
  const xHandle = useChild(Handle, { axis: 'x', color: 'red' });
  xHandle.getComponent(Transform).localPosition.set(1, 0, 0);

  // Y axis handle
  const yHandle = useChild(Handle, { axis: 'y', color: 'green' });
  yHandle.getComponent(Transform).localPosition.set(0, 1, 0);

  // Z axis handle
  const zHandle = useChild(Handle, { axis: 'z', color: 'blue' });
  zHandle.getComponent(Transform).localPosition.set(0, 0, 1);
}
```

## Scene Graph Queries

Navigate the hierarchy programmatically:

```typescript
import { ancestors, descendants, siblings } from '@pulse-ts/core';

function HierarchyQueries() {
  const transform = useComponent(Transform);
  const node = useNode();

  // Get all ancestors (parents, grandparents, etc.)
  const myAncestors = ancestors(node);

  // Get all descendants (children, grandchildren, etc.)
  const myDescendants = descendants(node);

  // Get siblings (other children of same parent)
  const mySiblings = siblings(node);

  // Find specific objects
  const camera = findInHierarchy('MainCamera');
  const enemies = findAllInHierarchy('Enemy');
}
```

## Best Practices

### Transform Organization
- **Group related objects** under common parents
- **Use local coordinates** for relative positioning
- **Keep hierarchies shallow** for performance

### Coordinate Systems
- **World space** for global positions (waypoints, level bounds)
- **Local space** for relative positions (character parts, UI elements)
- **Screen space** for UI and HUD elements

### Update Patterns
- **Batch transform updates** to minimize dirty marking
- **Use interpolation** for smooth visual motion
- **Cache world transforms** when accessing frequently

The scene graph is the foundation of spatial reasoning in Pulse. Master these concepts and you'll be able to create complex, hierarchical game worlds with ease!
