# Examples & Patterns

This guide contains practical examples and recipes for common patterns using @pulse-ts/core. Each example demonstrates core concepts like timing, state management, and component composition.

## Basic Game Objects

### Player Character

```typescript
function Player() {
  const transform = useComponent(Transform);
  const [velocity, setVelocity] = useState('velocity', new Vec3());
  const [health, setHealth] = useState('health', 100);

  // Input handling
  const input = useService(InputService);
  const moveSpeed = 5;
  const jumpForce = 10;

  useFixedUpdate((dt) => {
    let moveX = 0;
    let moveZ = 0;

    // Movement input
    if (input.isKeyPressed('KeyA')) moveX -= 1;
    if (input.isKeyPressed('KeyD')) moveX += 1;
    if (input.isKeyPressed('KeyW')) moveZ += 1;
    if (input.isKeyPressed('KeyS')) moveZ -= 1;

    // Normalize diagonal movement
    if (moveX !== 0 && moveZ !== 0) {
      moveX *= 0.707; // 1/sqrt(2)
      moveZ *= 0.707;
    }

    // Apply movement
    const moveVector = new Vec3(moveX, 0, moveZ);
    Vec3.normalize(moveVector, moveVector);
    Vec3.multiply(moveVector, moveSpeed * dt, moveVector);

    transform.localPosition.add(moveVector);

    // Jumping
    if (input.isKeyJustPressed('Space') && transform.localPosition.y < 0.1) {
      setVelocity(prev => ({ ...prev, y: jumpForce }));
    }

    // Apply gravity and velocity
    setVelocity(prev => ({
      x: prev.x * 0.9, // Air resistance
      y: prev.y - 9.81 * dt, // Gravity
      z: prev.z * 0.9,
    }));

    transform.localPosition.y += velocity.y * dt;

    // Ground collision
    if (transform.localPosition.y < 0) {
      transform.localPosition.y = 0;
      setVelocity(prev => ({ ...prev, y: 0 }));
    }
  });

  // Visual feedback
  useFrameUpdate(() => {
    // Face movement direction
    if (Math.abs(velocity.x) > 0.1 || Math.abs(velocity.z) > 0.1) {
      const angle = Math.atan2(velocity.x, velocity.z);
      transform.localRotation.y = angle;
    }

    // Health-based visual effects
    const healthPercent = health / 100;
    // Scale down as health decreases
    transform.localScale.set(healthPercent, 1, healthPercent);
  });

  return null;
}
```

### Collectible Items

```typescript
interface CollectibleProps {
  value: number;
  type: 'coin' | 'gem' | 'powerup';
  respawnTime?: number;
}

function Collectible({ value, type, respawnTime = 5000 }: CollectibleProps) {
  const transform = useComponent(Transform);
  const [collected, setCollected] = useState('collected', false);
  const [respawnTimer, setRespawnTimer] = useState('respawnTimer', 0);

  // Floating animation
  useFrameUpdate((dt) => {
    if (collected) {
      transform.localPosition.y = Math.sin(Date.now() * 0.005) * 0.2;
      transform.localRotation.y += dt * 2;
    }
  });

  // Respawn logic
  useFixedUpdate((dt) => {
    if (collected && respawnTimer > 0) {
      setRespawnTimer(prev => prev - dt * 1000);
      if (respawnTimer <= 0) {
        setCollected(false);
        setRespawnTimer(0);
      }
    }
  });

  // Collection detection (would be handled by collision system)
  const collect = () => {
    if (!collected) {
      setCollected(true);
      setRespawnTimer(respawnTime);

      // Add to player score
      const gameState = useService(GameStateService);
      gameState.addScore(value);

      // Visual effect
      createParticleEffect(transform.worldPosition, type);
    }
  };

  return null;
}
```

## Advanced Systems

### Camera System

```typescript
interface CameraConfig {
  target?: Node;
  offset: Vec3;
  followSpeed: number;
  lookAhead: number;
}

function CameraController({ target, offset, followSpeed, lookAhead }: CameraConfig) {
  const transform = useComponent(Transform);
  const [velocity, setVelocity] = useState('velocity', new Vec3());

  useFrameUpdate((dt) => {
    if (!target) return;

    const targetTransform = getComponent(target, Transform);
    if (!targetTransform) return;

    // Calculate desired position
    const targetPos = targetTransform.worldPosition;
    const targetVel = getComponent(target, Velocity)?.value || new Vec3();

    // Look-ahead based on velocity
    const lookAheadOffset = Vec3.multiply(targetVel, lookAhead);

    // Desired camera position
    const desiredPos = Vec3.add(
      Vec3.add(targetPos, offset),
      lookAheadOffset
    );

    // Smooth camera movement
    const currentPos = transform.worldPosition;
    const delta = Vec3.subtract(desiredPos, currentPos);

    // Apply smoothing
    Vec3.multiply(delta, followSpeed * dt, delta);
    transform.localPosition.add(delta);

    // Look at target
    const lookTarget = Vec3.add(targetPos, new Vec3(0, 1, 0)); // Look at head height
    const forward = Vec3.subtract(lookTarget, transform.worldPosition);
    Vec3.normalize(forward, forward);

    // Calculate rotation (simplified - full implementation would use Quat.lookAt)
    const yaw = Math.atan2(forward.x, forward.z);
    const pitch = Math.asin(forward.y);

    transform.localRotation.set(pitch, yaw, 0);
  });

  return null;
}
```

### Particle System

```typescript
interface ParticleConfig {
  count: number;
  lifetime: number;
  startSize: number;
  endSize: number;
  startColor: Vec3;
  endColor: Vec3;
  gravity: number;
  spread: number;
}

function ParticleEmitter({ config }: { config: ParticleConfig }) {
  const [particles, setParticles] = useState('particles', [] as Particle[]);
  const transform = useComponent(Transform);

  // Emit particles
  const emit = (count = 1) => {
    const newParticles = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        position: transform.worldPosition.clone(),
        velocity: new Vec3(
          (Math.random() - 0.5) * config.spread,
          Math.random() * 2,
          (Math.random() - 0.5) * config.spread
        ),
        lifetime: config.lifetime,
        age: 0,
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  };

  // Update particles
  useFixedUpdate((dt) => {
    setParticles(prev => prev.map(particle => ({
      ...particle,
      age: particle.age + dt,
      position: Vec3.add(
        particle.position,
        Vec3.multiply(particle.velocity, dt)
      ),
      velocity: new Vec3(
        particle.velocity.x,
        particle.velocity.y - config.gravity * dt,
        particle.velocity.z
      ),
    })).filter(particle => particle.age < particle.lifetime));
  });

  // Render particles
  useFrameUpdate(() => {
    particles.forEach(particle => {
      const lifeRatio = particle.age / particle.lifetime;
      const size = config.startSize + (config.endSize - config.startSize) * lifeRatio;
      const color = Vec3.lerp(config.startColor, config.endColor, lifeRatio);

      renderParticle(particle.position, size, color);
    });
  });

  return { emit };
}
```

## Game Mechanics

### Inventory System

```typescript
interface Item {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'consumable';
  stackable: boolean;
  maxStack: number;
}

class Inventory extends Component {
  items: Map<string, { item: Item; count: number }> = new Map();

  addItem(item: Item, count = 1) {
    const existing = this.items.get(item.id);
    if (existing && item.stackable) {
      existing.count = Math.min(existing.count + count, item.maxStack);
    } else if (!existing) {
      this.items.set(item.id, { item, count });
    }
    return true; // Could return false if inventory full
  }

  removeItem(itemId: string, count = 1) {
    const existing = this.items.get(itemId);
    if (existing) {
      existing.count -= count;
      if (existing.count <= 0) {
        this.items.delete(itemId);
      }
      return true;
    }
    return false;
  }

  hasItem(itemId: string, count = 1) {
    const existing = this.items.get(itemId);
    return existing && existing.count >= count;
  }
}

function PlayerInventory() {
  const inventory = useComponent(Inventory);

  const pickupItem = (item: Item) => {
    if (inventory.addItem(item)) {
      console.log(`Picked up ${item.name}`);
    } else {
      console.log('Inventory full!');
    }
  };

  const useItem = (itemId: string) => {
    if (inventory.hasItem(itemId)) {
      inventory.removeItem(itemId);
      // Apply item effects
      applyItemEffect(itemId);
    }
  };

  return { pickupItem, useItem, inventory };
}
```

### Dialogue System

```typescript
interface DialogueNode {
  id: string;
  text: string;
  choices: { text: string; nextId: string | null }[];
  speaker?: string;
}

class DialogueSystem extends Service {
  private dialogues: Map<string, DialogueNode> = new Map();
  private currentNode: DialogueNode | null = null;
  private onDialogueEnd?: () => void;

  loadDialogue(id: string, node: DialogueNode) {
    this.dialogues.set(id, node);
  }

  startDialogue(startId: string, onEnd?: () => void) {
    this.currentNode = this.dialogues.get(startId) || null;
    this.onDialogueEnd = onEnd;
  }

  selectChoice(choiceIndex: number) {
    if (!this.currentNode) return;

    const choice = this.currentNode.choices[choiceIndex];
    if (choice.nextId) {
      this.currentNode = this.dialogues.get(choice.nextId) || null;
    } else {
      this.endDialogue();
    }
  }

  getCurrentNode() {
    return this.currentNode;
  }

  endDialogue() {
    this.currentNode = null;
    this.onDialogueEnd?.();
  }
}

function DialogueUI() {
  const dialogue = useService(DialogueSystem);
  const currentNode = dialogue.getCurrentNode();

  if (!currentNode) return null;

  return (
    <div className="dialogue-box">
      {currentNode.speaker && <div className="speaker">{currentNode.speaker}</div>}
      <div className="text">{currentNode.text}</div>
      <div className="choices">
        {currentNode.choices.map((choice, index) => (
          <button
            key={index}
            onClick={() => dialogue.selectChoice(index)}
          >
            {choice.text}
          </button>
        ))}
      </div>
    </div>
  );
}
```

## UI & HUD

### Health Bar

```typescript
function HealthBar({ target }: { target: Node }) {
  const [health, setHealth] = useState('health', 100);
  const [maxHealth, setMaxHealth] = useState('maxHealth', 100);

  // Sync with target's health
  useFrameUpdate(() => {
    const targetHealth = getComponent(target, HealthComponent);
    if (targetHealth) {
      setHealth(targetHealth.current);
      setMaxHealth(targetHealth.max);
    }
  });

  const healthPercent = health / maxHealth;

  return (
    <div className="health-bar">
      <div className="health-fill" style={{ width: `${healthPercent * 100}%` }} />
      <div className="health-text">{health}/{maxHealth}</div>
    </div>
  );
}
```

### Mini Map

```typescript
function MiniMap({ worldSize }: { worldSize: number }) {
  const [entities, setEntities] = useState('entities', [] as Array<{
    position: Vec3;
    type: 'player' | 'enemy' | 'item';
  }>);

  // Update entity positions
  useFrameUpdate(() => {
    const allEntities = [];
    for (const node of world.nodes) {
      const transform = getComponent(node, Transform);
      const type = getEntityType(node); // Custom function

      if (transform && type) {
        allEntities.push({
          position: transform.worldPosition,
          type,
        });
      }
    }
    setEntities(allEntities);
  });

  return (
    <div className="minimap">
      {entities.map((entity, index) => {
        const x = (entity.position.x / worldSize + 0.5) * 200; // Map to 200px
        const z = (entity.position.z / worldSize + 0.5) * 200;

        return (
          <div
            key={index}
            className={`entity ${entity.type}`}
            style={{
              left: x,
              top: z,
            }}
          />
        );
      })}
    </div>
  );
}
```

## Performance Patterns

### Object Pooling

```typescript
class BulletPool extends Service {
  private pool: Bullet[] = [];
  private active: Set<Bullet> = new Set();

  getBullet(): Bullet | null {
    // Return inactive bullet from pool
    for (const bullet of this.pool) {
      if (!this.active.has(bullet)) {
        this.active.add(bullet);
        return bullet;
      }
    }

    // Create new bullet if pool empty
    if (this.pool.length < 100) { // Max pool size
      const bullet = new Bullet();
      this.pool.push(bullet);
      this.active.add(bullet);
      return bullet;
    }

    return null; // Pool exhausted
  }

  returnBullet(bullet: Bullet) {
    this.active.delete(bullet);
    bullet.reset(); // Reset bullet state
  }
}

function Bullet() {
  const transform = useComponent(Transform);
  const [active, setActive] = useState('active', true);

  useFixedUpdate((dt) => {
    if (!active) return;

    transform.localPosition.z += 10 * dt; // Move forward

    // Deactivate when off screen
    if (transform.localPosition.z > 50) {
      setActive(false);
      bulletPool.returnBullet(this);
    }
  });

  return null;
}
```

### Spatial Partitioning

```typescript
class SpatialGrid extends Service {
  private grid: Map<string, Node[]> = new Map();
  private cellSize = 10;

  private getCellKey(position: Vec3): string {
    const x = Math.floor(position.x / this.cellSize);
    const z = Math.floor(position.z / this.cellSize);
    return `${x},${z}`;
  }

  addEntity(node: Node) {
    const transform = getComponent(node, Transform);
    if (!transform) return;

    const key = this.getCellKey(transform.worldPosition);
    const cell = this.grid.get(key) || [];
    cell.push(node);
    this.grid.set(key, cell);
  }

  getNearbyEntities(position: Vec3, radius: number): Node[] {
    const nearby = [];
    const centerKey = this.getCellKey(position);
    const [centerX, centerZ] = centerKey.split(',').map(Number);

    // Check neighboring cells
    for (let x = centerX - 1; x <= centerX + 1; x++) {
      for (let z = centerZ - 1; z <= centerZ + 1; z++) {
        const key = `${x},${z}`;
        const cell = this.grid.get(key) || [];
        nearby.push(...cell);
      }
    }

    // Filter by actual distance
    return nearby.filter(node => {
      const transform = getComponent(node, Transform);
      return transform && Vec3.distance(transform.worldPosition, position) <= radius;
    });
  }

  updateEntity(node: Node) {
    // Remove from old cell and add to new cell
    this.removeEntity(node);
    this.addEntity(node);
  }

  removeEntity(node: Node) {
    for (const [key, cell] of this.grid) {
      const index = cell.indexOf(node);
      if (index >= 0) {
        cell.splice(index, 1);
        if (cell.length === 0) {
          this.grid.delete(key);
        }
        break;
      }
    }
  }
}
```

## Complete Game Example

### Simple Platformer

```typescript
function Game() {
  // Player
  const player = useChild(Player);

  // Platforms
  const platforms = [];
  for (let i = 0; i < 5; i++) {
    platforms.push(useChild(Platform, {
      x: i * 4 - 8,
      y: Math.sin(i) * 2,
    }));
  }

  // Camera following player
  const camera = useChild(CameraController, {
    target: player,
    offset: new Vec3(0, 5, -10),
    followSpeed: 2,
    lookAhead: 0.5,
  });

  return null;
}

function Platform({ x, y }: { x: number; y: number }) {
  const transform = useComponent(Transform);
  const bounds = useComponent(Bounds);

  useInit(() => {
    transform.localPosition.set(x, y, 0);
    bounds.setSize(4, 1, 1); // Platform dimensions
  });

  return null;
}

function Player() {
  const transform = useComponent(Transform);
  const [velocity, setVelocity] = useState('velocity', new Vec3());
  const [onGround, setOnGround] = useState('onGround', false);

  const input = useService(InputService);

  useFixedUpdate((dt) => {
    // Horizontal movement
    let moveX = 0;
    if (input.isKeyPressed('KeyA')) moveX -= 1;
    if (input.isKeyPressed('KeyD')) moveX += 1;

    // Apply movement
    transform.localPosition.x += moveX * 5 * dt;

    // Gravity
    setVelocity(prev => ({
      ...prev,
      y: prev.y - 9.81 * dt
    }));

    // Vertical movement
    transform.localPosition.y += velocity.y * dt;

    // Platform collision (simplified)
    const platforms = world.nodes.filter(node =>
      getComponent(node, Bounds) !== undefined
    );

    setOnGround(false);
    for (const platform of platforms) {
      const platformBounds = getComponent(platform, Bounds);
      const platformTransform = getComponent(platform, Transform);

      if (checkCollision(transform, bounds, platformTransform, platformBounds)) {
        // Resolve collision
        transform.localPosition.y = platformTransform.worldPosition.y + 0.5;
        setVelocity(prev => ({ ...prev, y: 0 }));
        setOnGround(true);
        break;
      }
    }

    // Jump
    if (input.isKeyJustPressed('Space') && onGround) {
      setVelocity(prev => ({ ...prev, y: 8 }));
    }
  });

  return null;
}
```

These examples demonstrate real-world patterns you'll encounter building games with Pulse. Start with the basics and gradually incorporate more advanced techniques as your project grows!
