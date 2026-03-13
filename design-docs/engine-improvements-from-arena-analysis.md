# Engine Improvements: Arena Demo Analysis

> Deep analysis of the arena demo's usage of pulse-ts, identifying generalized engine improvements that would reduce boilerplate, improve DX, and maintain extensibility.

---

## Table of Contents

1. [DOM Overlay Hook (`useOverlay`)](#1-dom-overlay-hook-useoverlay)
2. [Phase-Reactive Visibility Hook (`useWhen`)](#2-phase-reactive-visibility-hook-usephasevisible)
3. [World Bootstrap Factory (`buildWorld`)](#3-world-bootstrap-factory-creategame)
4. [Scoped State Stores (`useStore`)](#4-scoped-state-stores-usestore)
5. [Round/Event Change Hook (`useWatch`)](#5-roundevent-change-hook-usewatch)
6. [UI Button Component (`useButton`)](#6-ui-button-component-usebutton)
7. [Screen-Space Projection Hook (`useScreenProjection`)](#7-screen-space-projection-hook-usescreenprojection)
8. [Velocity-Based Trail Emitter (`useTrailEmitter`)](#8-velocity-based-trail-emitter-usetrailemitter)
9. [Lifecycle-Aware Network Channels](#9-lifecycle-aware-network-channels)
10. [State Machine Hook (`useStateMachine`)](#10-state-machine-hook-usestatemachine)
11. [Camera Shake Hook (`useCameraShake`)](#11-camera-shake-hook-usecamerashake)
12. [Animation Sequencing (`useSequence`)](#12-animation-sequencing-usesequence)
13. [Tween Hook (`useTween`)](#13-tween-hook-usetween)
14. [Mobile Device Utilities Package](#14-mobile-device-utilities-package)
15. [Virtual Joystick Hook (`useVirtualJoystick`)](#15-virtual-joystick-hook-usevirtualjoystick)
16. [Pooled Effect System (`useEffectPool`)](#16-pooled-effect-system-useeffectpool)
17. [Shader Material Hook (`useShaderMaterial`)](#17-shader-material-hook-useshadermaterial)
18. [Scene Composition Presets (`useLightingRig`)](#18-scene-composition-presets-useenvironment)
19. [Interpolation Utilities](#19-interpolation-utilities-lerp-damp-smoothstep)
20. [Post-Processing Pipeline Hook (`usePostProcessing`)](#20-post-processing-pipeline-hook-usepostprocessing)
21. [Design Token System (`defineTheme`)](#21-design-token-system-definetheme)
22. [Phase-Gated Update Hook (`usePhaseUpdate`)](#22-phase-gated-update-hook-usephaseupdate)
23. [Collision Response Helper (`useCollisionResponse`)](#23-collision-response-helper-usecollisionresponse)
24. [Backdrop / Modal Overlay Primitives (`useModal`)](#24-backdrop--modal-overlay-primitives-usebackdrop-usemodal)
25. [Fixed-Step Interpolation Hook (`useInterpolatedPosition`)](#25-fixed-step-interpolation-hook-useinterpolatedposition)
26. [Entity Prefab Pattern (`definePrefab`)](#26-entity-prefab-pattern-defineprefab)
27. [Module Reset Registry (`useModuleReset`)](#27-module-reset-registry-usemodulereset)
28. [Staggered Entrance Animation Hook (`useEntrance`)](#28-staggered-entrance-animation-hook-useentrance)
29. [Network Player Convenience Hook (`useRemoteEntity`)](#29-network-player-convenience-hook-useremoteentity)
30. [Round Reset Hook (`useRoundReset`)](#30-round-reset-hook-useroundreset)
31. [Scene / Screen Flow Manager (`useScreen`)](#31-scene--screen-flow-manager-usescreen)
32. [Temporal Ring Buffer (`RingBuffer`)](#32-temporal-ring-buffer-ringbuffert)
33. [`useMesh` Material Extensions](#33-usemesh-material-extensions-texture-maps--material-type)
34. [Timer Completion Callbacks](#34-timer-completion-callbacks-usetimer--usecooldown-enhancement)
35. [Marker Component Factory (`defineComponent`)](#35-marker-component-factory-definecomponent)
36. [Audio Mixing Groups (`useSoundGroup`)](#36-audio-mixing-groups-usesoundgroup)
37. [Input Binding Shorthand](#37-input-binding-shorthand-axis2d-simplification)
38. [Custom Geometry Hook (`useCustomGeometry`)](#38-custom-geometry-hook-usecustomgeometry)
39. [Network Clock Sync Utilities (`useSyncedTimer`)](#39-network-clock-sync-utilities-usesyncedtimer)
40. [Collision Filter Hook](#40-collision-filter-hook-useoncollisionstartfiltered)
41. [Procedural Texture Factory (`createTexture`)](#41-procedural-texture-factory-createtexture)
42. [Trail Buffer (`TrailBuffer<T>`)](#42-trail-buffer-trailbuffert)
43. [Throttled Update Hook (`useThrottledUpdate`)](#43-throttled-update-hook-usethrottledupdate)
44. [Conditional Child Hook (`useConditionalChild`)](#44-conditional-child-hook-useconditionalchild)
45. [Spatial Influence Field (`useInfluenceField`)](#45-spatial-influence-field-useinfluencefield)
46. [Animation Binding Hook (`useAnimationBinding`)](#46-animation-binding-hook-useanimationbinding)
47. [Noise Function Utilities](#47-noise-function-utilities)
48. [World Lifecycle Events](#48-world-lifecycle-events)
49. [Scene Query Hook (`useSceneQuery`)](#49-scene-query-hook-usescenequery)
50. [Sound Effect Registry (`defineSoundEffect` / `useSoundEffect`)](#50-sound-effect-registry-definesoundeffect--usesoundeffect)

---

## 1. DOM Overlay Hook (`useOverlay`)

**Package:** `@pulse-ts/three` (new hook)

**Problem:** Every node that renders DOM UI (12+ nodes in the arena demo) repeats identical boilerplate to get the renderer container, create a div, style it, append it, and register a `useDestroy` cleanup. This is the single most repeated pattern in the entire demo.

**Criteria check:**
- Extensible: Returns the raw DOM element for arbitrary customization
- Better DX: Eliminates 8-12 lines of boilerplate per overlay element
- Generalized: Any game with HUD, menus, tooltips, or overlays benefits

### Before

```typescript
// CountdownOverlayNode.ts — repeated in 12+ nodes
import { useDestroy } from '@pulse-ts/core';
import { useThreeContext } from '@pulse-ts/three';

export function CountdownOverlayNode() {
    const { renderer } = useThreeContext();
    const container = renderer.domElement.parentElement ?? document.body;

    const el = document.createElement('div');
    Object.assign(el.style, {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: '3000',
        font: 'bold clamp(40px, 14vw, 72px) monospace',
        color: '#fff',
        textShadow: '0 0 16px rgba(0,0,0,0.8)',
        transition: 'opacity 0.2s ease-out',
        opacity: '0',
        pointerEvents: 'none',
    } as Partial<CSSStyleDeclaration>);
    container.appendChild(el);

    useDestroy(() => {
        el.remove();
    });

    // ... use el ...
}
```

### After

```typescript
import { useOverlay } from '@pulse-ts/three';

export function CountdownOverlayNode() {
    const el = useOverlay({
        tag: 'div',
        style: {
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: '3000',
            font: 'bold clamp(40px, 14vw, 72px) monospace',
            color: '#fff',
            textShadow: '0 0 16px rgba(0,0,0,0.8)',
            transition: 'opacity 0.2s ease-out',
            opacity: '0',
        },
    });

    // ... use el ...
}
```

### API Design

```typescript
interface UseOverlayOptions {
    /** HTML tag to create. Default: 'div'. */
    tag?: string;
    /** Initial styles. `position: absolute` and `pointerEvents: none` applied by default. */
    style?: Partial<CSSStyleDeclaration>;
    /** Optional parent override. Default: renderer's parent element. */
    parent?: HTMLElement;
}

/**
 * Creates a DOM element overlaid on the renderer canvas.
 * Automatically positioned absolute, pointer-events none, and cleaned up on destroy.
 */
function useOverlay<K extends keyof HTMLElementTagNameMap = 'div'>(
    options?: UseOverlayOptions & { tag?: K },
): HTMLElementTagNameMap[K];
```

---

## 2. Phase-Reactive Visibility Hook (`usePhaseVisible`)

**Package:** `@pulse-ts/core` (new hook)

**Problem:** 10+ overlay nodes contain near-identical `useFrameUpdate` callbacks that set `el.style.opacity` based on comparing a context value to a target. This is a general "show/hide when condition is met" pattern.

**Criteria check:**
- Extensible: Accepts any predicate function, not coupled to game phases
- Better DX: Replaces repeated `useFrameUpdate` + opacity toggling
- Generalized: Useful for any conditional visibility in any game type

### Before

```typescript
// Repeated in CountdownOverlayNode, KnockoutOverlayNode, ScoreHudNode,
// MatchOverOverlayNode, PauseMenuNode, DisconnectOverlayNode, etc.
useFrameUpdate(() => {
    const visible = gameState.phase === 'countdown';
    el.style.opacity = visible ? '1' : '0';
});
```

```typescript
// ScoreHudNode — more complex variant
useFrameUpdate(() => {
    const inReplay = gameState.phase === 'replay' && isReplayActive();
    const hidden = gameState.phase === 'intro' || inReplay;
    border.style.opacity = hidden ? '0' : '1';
});
```

### After

```typescript
import { useWhen } from '@pulse-ts/core';

// Simple case — returns a reactive getter
const isVisible = useWhen(() => gameState.phase === 'countdown');

useFrameUpdate(() => {
    el.style.opacity = isVisible() ? '1' : '0';
});
```

```typescript
// With enter/exit callbacks for one-shot animations
const isVisible = useWhen(
    () => gameState.phase === 'match_over',
    {
        onEnter: () => applyStaggeredEntrance([text, buttonCol], 300),
    },
);
```

### API Design

```typescript
interface UseWhenOptions {
    /** Called once when the predicate transitions from false → true. */
    onEnter?: () => void;
    /** Called once when the predicate transitions from true → false. */
    onExit?: () => void;
}

/**
 * Tracks a boolean predicate each frame, returning a stable getter.
 * Optionally fires callbacks on transitions.
 */
function useWhen(
    predicate: () => boolean,
    options?: UseWhenOptions,
): () => boolean;
```

---

## 3. World Bootstrap Factory (`createGame`)

**Package:** `@pulse-ts/core` (new utility)

**Problem:** The arena demo's `main.ts` has three game-start functions (`startLocalGame`, `startSoloGame`, `startOnlineGame`) that share ~80% identical setup: create World, install defaults, install audio, install input, install physics, install Three.js, configure shadows, configure pixel ratio, setup post-processing. Only the final 10-20% differs per mode.

**Criteria check:**
- Extensible: Builder pattern lets callers install any combination of packages
- Better DX: Eliminates 30+ lines of repeated setup per game mode
- Generalized: Every game needs world bootstrap; this is not genre-specific

### Before

```typescript
// main.ts — repeated 3 times with minor variations
function startLocalGame(): Promise<void> {
    return new Promise((resolve) => {
        const world = new World();

        installDefaults(world);
        installAudio(world);
        installInput(world, { preventDefault: true, bindings: allBindings });
        installPhysics(world, { gravity: { x: 0, y: -20, z: 0 } });

        const mobile = isMobileDevice();
        const three = installThree(world, {
            canvas,
            clearColor: 0x050508,
        });

        if (mobile) {
            three.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        }

        if (!mobile) {
            three.renderer.shadowMap.enabled = true;
            three.renderer.shadowMap.type = 1;
        }
        const shockwavePass = setupPostProcessing(three);

        const cleanup = () => {
            three.renderer.clear();
            world.destroy();
        };

        world.mount(ArenaNode, { /* ... */ });
        world.start();
    });
}

// startSoloGame — nearly identical setup...
// startOnlineGame — nearly identical setup...
```

### After

```typescript
import { buildWorld } from '@pulse-ts/core';

function startLocalGame(): Promise<void> {
    return new Promise((resolve) => {
        const { world, cleanup } = buildWorld()
            .use(installDefaults)
            .use(installAudio)
            .use(installInput, { preventDefault: true, bindings: allBindings })
            .use(installPhysics, { gravity: { x: 0, y: -20, z: 0 } })
            .use(installThree, { canvas, clearColor: 0x050508 })
            .build();

        world.mount(ArenaNode, {
            onRequestMenu: () => { cleanup(); resolve(); },
        });
        world.start();
    });
}
```

### API Design

```typescript
interface WorldBuilder {
    /** Register an installer function with options. */
    use<O, R>(installer: (world: World, opts?: O) => R, opts?: O): WorldBuilder;
    /** Register an async installer (e.g., installNetwork). */
    useAsync<O, R>(installer: (world: World, opts?: O) => Promise<R>, opts?: O): WorldBuilder;
    /** Build the world, running all installers in registration order. */
    build(): Promise<{ world: World; cleanup: () => void }>;
}

function buildWorld(options?: WorldOptions): WorldBuilder;
```

---

## 4. Scoped State Stores (`useStore`)

**Package:** `@pulse-ts/core` (new hook)

**Problem:** The arena demo has 5+ module-scoped singleton state stores (`dashCooldown.ts`, `hitImpact.ts`, `playerVelocity.ts`, `shockwave.ts`, `replay.ts`) that manage hidden mutable state via module-level variables. These have no lifecycle — they persist across world destroys, requiring manual `reset*()` calls in GameManagerNode. Any game with cross-node shared state faces this problem.

**Criteria check:**
- Extensible: Store shape is user-defined; any data structure works
- Better DX: Automatic cleanup on world destroy; no manual reset functions
- Generalized: Cross-node state sharing is fundamental to all game architectures

### Before

```typescript
// dashCooldown.ts — module-scoped singleton
const progress: [number, number] = [1, 1];

export function setDashCooldownProgress(playerId: number, value: number): void {
    progress[playerId] = value;
}

export function getDashCooldownProgress(playerId: number): number {
    return progress[playerId];
}

export function resetDashCooldownProgress(): void {
    progress[0] = 1;
    progress[1] = 1;
}
```

```typescript
// GameManagerNode.ts — must manually reset all stores
clearRecording();
endReplay();
resetDashCooldownProgress();
resetHitImpacts();
resetPlayerPositions();
resetCameraShake();
resetPlayerVelocity();
```

### After

```typescript
// dashCooldown.ts — world-scoped store
import { defineStore } from '@pulse-ts/core';

export const DashCooldownStore = defineStore('dashCooldown', () => ({
    progress: [1, 1] as [number, number],
}));
```

```typescript
// LocalPlayerNode.ts — use it
import { useStore } from '@pulse-ts/core';
import { DashCooldownStore } from '../stores/dashCooldown';

function LocalPlayerNode({ playerId }: Props) {
    const cooldown = useStore(DashCooldownStore);

    useFrameUpdate(() => {
        cooldown.progress[playerId] = dashCD.ready ? 1 : 1 - dashCD.remaining / DASH_COOLDOWN;
    });
}
```

```typescript
// DashCooldownHudNode.ts — read it
function DashCooldownHudNode({ playerId }: Props) {
    const cooldown = useStore(DashCooldownStore);

    useFrameUpdate(() => {
        const pct = cooldown.progress[playerId];
        // draw cooldown indicator...
    });
}

// No manual resets needed — store is destroyed with the world.
```

### API Design

```typescript
/**
 * Define a named store with a factory function that creates the initial state.
 * The factory is called once per world, and the state is destroyed with the world.
 */
function defineStore<T>(name: string, factory: () => T): StoreDefinition<T>;

/**
 * Access a store within a function component. Creates the store on first access
 * within the current world. Returns the same instance for all callers in the same world.
 */
function useStore<T>(definition: StoreDefinition<T>): T;
```

---

## 5. Round/Event Change Hook (`useWatch`)

**Package:** `@pulse-ts/core` (new hook)

**Problem:** 6+ arena nodes contain identical "detect when a value changes" boilerplate: store the previous value in a closure variable, compare each tick, and run a callback when different. Common patterns: round reset detection, phase transition detection, countdown value change.

**Criteria check:**
- Extensible: Watches any derived value, not coupled to specific state shape
- Better DX: Eliminates repeated closure-variable tracking pattern
- Generalized: State change detection is universal across all game types

### Before

```typescript
// Round reset — repeated in LocalPlayerNode, RemotePlayerNode,
// TouchControlsNode, DashCooldownHudNode, etc.
let lastRound = gameState.round;

useFixedUpdate(() => {
    if (gameState.round !== lastRound) {
        lastRound = gameState.round;
        // reset logic: teleport to spawn, reset velocity, etc.
        knockedOut = false;
        root.visible = true;
        transform.localPosition.set(...spawn);
        body.setLinearVelocity(0, 0, 0);
        dashTimer.cancel();
        dashCD.reset();
    }
});
```

```typescript
// Phase transition detection — also repeated
let lastPhase = gameState.phase;

useFixedUpdate(() => {
    if (gameState.phase === 'playing' && lastPhase !== 'playing') {
        dashCD.trigger();
    }
    lastPhase = gameState.phase;
});
```

### After

```typescript
import { useWatch } from '@pulse-ts/core';

// Round reset — one line
useWatch(() => gameState.round, () => {
    knockedOut = false;
    root.visible = true;
    transform.localPosition.set(...spawn);
    body.setLinearVelocity(0, 0, 0);
    dashTimer.cancel();
    dashCD.reset();
});

// Phase transition
useWatch(() => gameState.phase, (phase, prevPhase) => {
    if (phase === 'playing' && prevPhase !== 'playing') {
        dashCD.trigger();
    }
});
```

### API Design

```typescript
/**
 * Watch a derived value each fixed tick. When the value changes (strict equality),
 * invoke the callback with the new and previous values.
 * Skips the initial value (does not fire on mount).
 *
 * @param selector - A function that returns the value to watch.
 * @param callback - Called with (newValue, oldValue) when the value changes.
 * @param options - Optional: { kind: 'fixed' | 'frame' } to choose tick phase. Default: 'fixed'.
 */
function useWatch<T>(
    selector: () => T,
    callback: (value: T, prev: T) => void,
    options?: { kind?: 'fixed' | 'frame' },
): void;
```

---

## 6. UI Button Component (`useButton`)

**Package:** `@pulse-ts/three` (new hook, depends on `useOverlay`)

**Problem:** Three arena nodes (MatchOverOverlayNode, PauseMenuNode, DisconnectOverlayNode) independently create styled buttons with identical press-effect event listeners (pointerdown/up/leave state management), hover scaling, and styling. Each duplicates 30+ lines of the same button factory.

**Criteria check:**
- Extensible: Returns raw HTMLButtonElement for arbitrary customization; style overrides supported
- Better DX: Replaces 30+ lines with a single hook call
- Generalized: Every game with menus, dialogs, or HUD buttons benefits

### Before

```typescript
// MatchOverOverlayNode.ts — also in PauseMenuNode, DisconnectOverlayNode
const createButton = (label: string): HTMLButtonElement => {
    const btn = document.createElement('button');
    btn.textContent = label;
    Object.assign(btn.style, {
        font: 'bold clamp(14px, 3.5vw, 18px) monospace',
        color: '#fff',
        backgroundColor: 'rgba(255,255,255,0.08)',
        border: '2px solid rgba(255,255,255,0.2)',
        borderRadius: '6px',
        padding: '12px 32px',
        minHeight: '44px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    } as Partial<CSSStyleDeclaration>);

    const addPressEffect = (b: HTMLButtonElement) => {
        b.addEventListener('pointerdown', () => {
            b.style.backgroundColor = 'rgba(255,255,255,0.15)';
            b.style.borderColor = '#48c9b0';
            b.style.boxShadow = '0 0 12px #48c9b044';
        });
        b.addEventListener('pointerup', () => {
            b.style.backgroundColor = 'rgba(255,255,255,0.08)';
            b.style.borderColor = 'rgba(255,255,255,0.2)';
            b.style.boxShadow = 'none';
        });
        b.addEventListener('pointerleave', () => {
            b.style.backgroundColor = 'rgba(255,255,255,0.08)';
            b.style.borderColor = 'rgba(255,255,255,0.2)';
            b.style.boxShadow = 'none';
        });
    };

    addPressEffect(btn);
    return btn;
};

const rematchBtn = createButton('Rematch');
applyButtonHoverScale(rematchBtn);
rematchBtn.addEventListener('click', () => { /* ... */ });
```

### After

```typescript
import { useButton } from '@pulse-ts/three';

const rematchBtn = useButton('Rematch', {
    onClick: () => { /* ... */ },
});

const menuBtn = useButton('Main Menu', {
    onClick: () => { /* ... */ },
});
```

### API Design

```typescript
interface UseButtonOptions {
    /** Click handler. */
    onClick?: (e: PointerEvent) => void;
    /** Style overrides. */
    style?: Partial<CSSStyleDeclaration>;
    /** Parent element. Default: renderer's parent element. */
    parent?: HTMLElement;
    /** Accent color for press/hover effects. Default: '#48c9b0'. */
    accent?: string;
}

/**
 * Creates a styled overlay button with built-in press/hover feedback.
 * Cleaned up automatically on node destroy.
 */
function useButton(label: string, options?: UseButtonOptions): HTMLButtonElement;
```

---

## 7. Screen-Space Projection Hook (`useScreenProjection`)

**Package:** `@pulse-ts/three` (new hook)

**Problem:** LocalPlayerNode manually projects 3D positions to screen coordinates for the indicator ring each frame, involving Three.js Vector3 allocation, `vector.project(camera)`, and coordinate conversion. This is a general pattern needed by any game that places DOM elements over 3D objects (health bars, name tags, tooltips, selection rings).

**Criteria check:**
- Extensible: Returns raw screen coordinates for any use
- Better DX: Eliminates manual Vector3 management and camera projection math
- Generalized: Essential for any 3D game with UI overlays anchored to world positions

### Before

```typescript
// LocalPlayerNode.ts — manual projection each frame
const projCenter = new THREE.Vector3();
const projEdge = new THREE.Vector3();

useFrameUpdate(() => {
    if (indicatorRing) {
        const hw = threeRenderer.domElement.clientWidth / 2;
        const hh = threeRenderer.domElement.clientHeight / 2;

        // Project player center to screen
        projCenter
            .set(root.position.x, root.position.y, root.position.z)
            .project(threeCamera);
        const sx = projCenter.x * hw + hw;
        const sy = -projCenter.y * hh + hh;

        // Project edge point to get screen-space radius
        projEdge
            .set(
                root.position.x + PLAYER_RADIUS * INDICATOR_RING_SCALE,
                root.position.y,
                root.position.z,
            )
            .project(threeCamera);
        const edgeSx = projEdge.x * hw + hw;
        const radius = Math.abs(edgeSx - sx);
        const size = radius * 2;

        indicatorRing.style.width = `${size}px`;
        indicatorRing.style.height = `${size}px`;
        indicatorRing.style.left = `${sx - radius}px`;
        indicatorRing.style.top = `${sy - radius}px`;
    }
});
```

### After

```typescript
import { useScreenProjection } from '@pulse-ts/three';

const project = useScreenProjection();

useFrameUpdate(() => {
    if (indicatorRing) {
        const { x, y } = project(root.position);
        const edge = project({
            x: root.position.x + PLAYER_RADIUS * INDICATOR_RING_SCALE,
            y: root.position.y,
            z: root.position.z,
        });
        const radius = Math.abs(edge.x - x);

        indicatorRing.style.width = `${radius * 2}px`;
        indicatorRing.style.height = `${radius * 2}px`;
        indicatorRing.style.left = `${x - radius}px`;
        indicatorRing.style.top = `${y - radius}px`;
    }
});
```

### API Design

```typescript
interface ScreenPoint {
    /** Screen-space X in pixels (0 = left edge). */
    x: number;
    /** Screen-space Y in pixels (0 = top edge). */
    y: number;
    /** Normalized depth (0 = near, 1 = far). Useful for z-sorting overlays. */
    depth: number;
    /** Whether the point is in front of the camera. */
    visible: boolean;
}

interface WorldPoint {
    x: number;
    y: number;
    z: number;
}

/**
 * Returns a projection function that converts world-space positions
 * to screen-space pixel coordinates. Uses the active Three.js camera
 * and renderer dimensions. Reuses internal Vector3 to avoid allocation.
 */
function useScreenProjection(): (position: WorldPoint) => ScreenPoint;
```

---

## 8. Velocity-Based Trail Emitter (`useTrailEmitter`)

**Package:** `@pulse-ts/effects` (new hook)

**Problem:** The arena demo has 3 copies of the same velocity-proportional trail particle emission logic (LocalPlayerNode, RemotePlayerNode, ReplayNode). Each manually tracks accumulator time, computes velocity magnitude, scales emission interval by a reference velocity, and emits bursts. This pattern is universal — any game with moving objects that leave particle trails needs it.

**Criteria check:**
- Extensible: Configurable velocity reference, interval, and particle style
- Better DX: Replaces 20+ lines of manual accumulator logic with a single hook
- Generalized: Trails are used in racing, platformers, shooters, RPGs, etc.

### Before

```typescript
// LocalPlayerNode.ts — also in RemotePlayerNode, ReplayNode
const trailBurst = useParticleBurst({
    count: 8,
    lifetime: 1.0,
    color: meshColor,
    speed: [0.2, 0.8],
    gravity: 1,
    size: 0.4,
    blending: 'additive',
    shrink: true,
});
let trailAccum = 0;

useFrameUpdate((dt) => {
    if (gameState.phase === 'playing') {
        const vx = body.linearVelocity.x;
        const vz = body.linearVelocity.z;
        const vmag = Math.sqrt(vx * vx + vz * vz);
        if (vmag > 0.1) {
            trailAccum += dt;
            const interval = Math.max(
                0.01,
                TRAIL_BASE_INTERVAL / (vmag / TRAIL_VELOCITY_REFERENCE),
            );
            if (trailAccum >= interval) {
                trailAccum = 0;
                trailBurst([
                    root.position.x,
                    root.position.y,
                    root.position.z,
                ]);
            }
        } else {
            trailAccum = 0;
        }
    } else {
        trailAccum = 0;
    }
});
```

### After

```typescript
import { useTrailEmitter } from '@pulse-ts/effects';

const trail = useTrailEmitter({
    particle: {
        count: 8, lifetime: 1.0, color: meshColor,
        speed: [0.2, 0.8], gravity: 1, size: 0.4,
        blending: 'additive', shrink: true,
    },
    baseInterval: TRAIL_BASE_INTERVAL,
    velocityReference: TRAIL_VELOCITY_REFERENCE,
    minSpeed: 0.1,
});

useFrameUpdate((dt) => {
    if (gameState.phase === 'playing') {
        const vx = body.linearVelocity.x;
        const vz = body.linearVelocity.z;
        trail.update(dt, [root.position.x, root.position.y, root.position.z], vx, vz);
    } else {
        trail.reset();
    }
});
```

### API Design

```typescript
interface TrailEmitterOptions {
    /** Particle burst configuration (same as useParticleBurst options). */
    particle: ParticleBurstOptions;
    /** Base emission interval in seconds. */
    baseInterval: number;
    /** Speed at which emission runs at baseInterval. Higher = sparser at low speeds. */
    velocityReference: number;
    /** Below this speed, no particles are emitted. Default: 0.1. */
    minSpeed?: number;
}

interface TrailEmitterHandle {
    /** Update the emitter. Call each frame with dt, position, and velocity components. */
    update(dt: number, position: Point3, vx: number, vz: number): void;
    /** Reset the accumulator (e.g., when switching phases). */
    reset(): void;
}

function useTrailEmitter(options: TrailEmitterOptions): TrailEmitterHandle;
```

---

## 9. Lifecycle-Aware Network Channels

**Package:** `@pulse-ts/network` (enhancement to existing `useChannel`)

**Problem:** Several arena nodes need to publish a network message and then immediately destroy the world (e.g., rematch accept, menu exit). Because `publish()` queues to an outbox that's flushed by `NetworkTick` on the next tick, the message is lost if the world is destroyed synchronously. The workaround is a manual `flushNet()` helper called after every publish. This is error-prone and produces 5+ instances of manual flush calls.

**Criteria check:**
- Extensible: Opt-in behavior via option flag; doesn't change default semantics
- Better DX: Eliminates the footgun of forgetting to flush before destroy
- Generalized: Any networked game with world transitions (level changes, rematches, disconnects)

### Before

```typescript
// MatchOverOverlayNode.ts — manual flush pattern
const world = useWorld();
const flushNet = () => world.getService(TransportService)?.flushOutgoing();

// Every publish site must remember to flush:
rematchBtn.addEventListener('click', () => {
    ch.publish({ type: 'offer' });
    flushNet();  // Easy to forget!
    rematchState = 'waiting';
});

menuBtn.addEventListener('click', () => {
    ch.publish({ type: 'decline' });
    flushNet();  // Easy to forget!
    props.onRequestMenu?.();
});
```

### After

```typescript
// Option A: Channel-level flush option
const ch = useChannel(RematchChannel, onMessage, { flushOnPublish: true });

rematchBtn.addEventListener('click', () => {
    ch.publish({ type: 'offer' });  // Automatically flushed
    rematchState = 'waiting';
});

// Option B: World-level auto-flush on destroy
// The network system registers a destroy hook that flushes all pending messages.
// No code changes needed — it just works.
```

### API Design

```typescript
// Enhancement to existing useChannel options
interface ChannelOptions {
    /** When true, publish() calls flushOutgoing() immediately. Default: false. */
    flushOnPublish?: boolean;
}

// OR — automatic flush on world destroy (transparent improvement)
// In NetworkTick or installNetwork:
useDestroy(() => {
    transportService.flushOutgoing();
});
```

---

## 10. State Machine Hook (`useStateMachine`)

**Package:** `@pulse-ts/core` (new hook)

**Problem:** GameManagerNode is 400+ lines primarily because it hand-rolls a state machine with a switch statement over phases, manual timer management, and interleaved transition logic. This pattern — "when in state X and condition Y, transition to state Z and run effects" — is universal across all game types (menus, AI, cutscenes, tutorials, combat systems).

**Criteria check:**
- Extensible: States and transitions are data-driven; add new states trivially
- Better DX: Declarative transitions replace imperative spaghetti
- Generalized: State machines are fundamental to all game programming

### Before

```typescript
// GameManagerNode.ts — imperative state machine (simplified excerpt)
useFixedUpdate(() => {
    switch (gameState.phase) {
        case 'replay': {
            if (!isReplayActive()) {
                endReplay();
                gameState.round++;
                const scorer = gameState.isTie ? -1 : 1 - gameState.lastKnockedOut;
                applyScoring(scorer, gameState.isTie);
                // Side effects: play sound, set timers, check win condition...
            }
            break;
        }

        case 'ko_flash':
            if (!koFlashTimer.active) {
                gameState.phase = 'resetting';
                resetPauseTimer.reset();
                gameState.isTie = false;
                gameState.pendingKnockout2 = -1;
                clearRecording();
            }
            break;

        case 'resetting':
            if (!resetPauseTimer.active) {
                gameState.phase = 'countdown';
            }
            break;

        case 'countdown': {
            if (!countdownTimer.active && gameState.countdownValue < 0) {
                countdownTimer.reset();
                gameState.countdownValue = 3;
            }
            // ... 40 more lines of countdown logic with RTT compensation
            break;
        }

        default:
            break;
    }
});
```

### After

```typescript
import { useStateMachine } from '@pulse-ts/core';

const sm = useStateMachine({
    initial: 'intro',

    states: {
        intro: {},

        countdown: {
            onEnter: () => {
                countdownTimer.reset();
                gameState.countdownValue = 3;
            },
        },

        playing: {},

        replay: {
            onEnter: (ctx) => startReplay(ctx.lastKnockedOut),
        },

        ko_flash: {
            onEnter: () => {
                koFlashTimer.reset();
                koAnnounceSfx.play();
            },
        },

        resetting: {
            onEnter: () => {
                resetPauseTimer.reset();
                clearRecording();
            },
        },

        match_over: {
            onEnter: () => matchFanfareSfx.play(),
        },
    },

    transitions: [
        { from: 'playing',    to: 'replay',     when: () => gameState.pendingKnockout >= 0 },
        { from: 'replay',     to: 'ko_flash',   when: () => !isReplayActive() },
        { from: 'ko_flash',   to: 'resetting',  when: () => !koFlashTimer.active },
        { from: 'resetting',  to: 'countdown',  when: () => !resetPauseTimer.active },
        { from: 'countdown',  to: 'playing',    when: () => !countdownTimer.active },
    ],
});

// sm.current gives the current state name
// sm.send('event') for explicit transitions
// Transitions are evaluated automatically each fixed tick
```

### API Design

```typescript
interface StateMachineConfig<S extends string> {
    /** Initial state. */
    initial: S;
    /** State definitions with optional lifecycle hooks. */
    states: Record<S, {
        onEnter?: () => void;
        onExit?: () => void;
        onUpdate?: (dt: number) => void;
    }>;
    /** Automatic transitions evaluated each tick in order. */
    transitions?: Array<{
        from: S | S[];
        to: S;
        when: () => boolean;
        /** Side effect to run during the transition. */
        action?: () => void;
    }>;
}

interface StateMachineHandle<S extends string> {
    /** Current state name. */
    readonly current: S;
    /** Force a transition to a specific state. */
    send(state: S): void;
}

/**
 * Declarative state machine that evaluates transitions each fixed tick.
 * Fires onExit/onEnter hooks on state changes.
 */
function useStateMachine<S extends string>(
    config: StateMachineConfig<S>,
): StateMachineHandle<S>;
```

---

## Summary

| # | Improvement | Package | Impact | Arena nodes affected |
|---|-----------|---------|--------|---------------------|
| 1 | `useOverlay` | `@pulse-ts/three` | Eliminates DOM boilerplate | 12+ nodes |
| 2 | `useWhen` | `@pulse-ts/core` | Reactive visibility/transition tracking | 10+ nodes |
| 3 | `buildWorld` | `@pulse-ts/core` | Eliminates bootstrap duplication | main.ts (3 functions) |
| 4 | `defineStore`/`useStore` | `@pulse-ts/core` | World-scoped shared state | 5 singleton modules + GameManagerNode |
| 5 | `useWatch` | `@pulse-ts/core` | Declarative value-change detection | 6+ nodes |
| 6 | `useButton` | `@pulse-ts/three` | Eliminates button factory duplication | 3 overlay nodes |
| 7 | `useScreenProjection` | `@pulse-ts/three` | Simplifies 3D→screen coordinate mapping | Any node with DOM-over-3D |
| 8 | `useTrailEmitter` | `@pulse-ts/effects` | Velocity-proportional trail emission | 3 player/replay nodes |
| 9 | Lifecycle-aware channels | `@pulse-ts/network` | Prevents lost messages on world destroy | 2+ networked nodes |
| 10 | `useStateMachine` | `@pulse-ts/core` | Declarative state machines | GameManagerNode, AI, menus |

---

## 11. Camera Shake Hook (`useCameraShake`)

**Package:** `@pulse-ts/three` (new hook)

**Problem:** CameraRigNode implements camera shake via module-level mutable state (`triggerCameraShake`, `resetCameraShake`). This is a common game effect that every project re-implements — the arena demo exports bare functions from a specific node file, making reuse impossible without importing from that node. The pattern of "apply random offset with decay" is universal.

**Criteria check:**
- Extensible: Configurable decay curves, directional constraints, stacking behavior
- Better DX: Eliminates manual module-level shake state management
- Generalized: Used in shooters, platformers, RPGs, horror games, racing, etc.

### Before

```typescript
// CameraRigNode.ts — module-level state
let shakeIntensity = 0;
let shakeDuration = 0;
let shakeElapsed = 0;

export function triggerCameraShake(intensity: number, duration: number): void {
    if (intensity > shakeIntensity) {
        shakeIntensity = intensity;
        shakeDuration = duration;
        shakeElapsed = 0;
    }
}

export function resetCameraShake(): void {
    shakeIntensity = 0;
    shakeDuration = 0;
    shakeElapsed = 0;
}

// In CameraRigNode's useFrameUpdate:
if (shakeIntensity > 0) {
    shakeElapsed += dt;
    const t = Math.min(shakeElapsed / shakeDuration, 1);
    const decay = 1 - t;
    if (t >= 1) {
        shakeIntensity = 0;
    } else {
        const offset = shakeIntensity * decay;
        finalX += (Math.random() * 2 - 1) * offset;
        finalZ += (Math.random() * 2 - 1) * offset;
    }
}
```

### After

```typescript
import { useCameraShake } from '@pulse-ts/three';

function CameraRigNode() {
    const shake = useCameraShake();

    useFrameUpdate((dt) => {
        const offset = shake.sample(dt);
        finalX += offset.x;
        finalZ += offset.z;
    });

    // From other nodes, trigger via the store:
    // shake.trigger(0.3, 0.2);
}
```

### API Design

```typescript
interface CameraShakeHandle {
    /** Trigger a shake. Stronger shakes override weaker active ones. */
    trigger(intensity: number, duration: number): void;
    /** Sample the current offset for this frame. Advances the decay. */
    sample(dt: number): { x: number; y: number; z: number };
    /** Cancel any active shake. */
    reset(): void;
}

function useCameraShake(options?: {
    /** Axes to apply shake on. Default: { x: true, y: false, z: true }. */
    axes?: { x?: boolean; y?: boolean; z?: boolean };
    /** Decay curve. Default: 'linear'. */
    decay?: 'linear' | 'exponential' | ((t: number) => number);
}): CameraShakeHandle;
```

---

## 12. Animation Sequencing (`useSequence`)

**Package:** `@pulse-ts/effects` (new hook)

**Problem:** The arena demo has many cases of time-sequenced effects: IntroOverlayNode fades in labels, waits 3 seconds, then fades out and transitions phase. ReplayNode shows letterboxes, plays replay, triggers camera shake at hit moments, then fades back. These sequences are implemented with elapsed-time counters and nested `if` chains. Any game with cutscenes, tutorials, or multi-step visual effects has this same problem.

**Criteria check:**
- Extensible: Steps are composable; support delays, parallel actions, and callbacks
- Better DX: Replaces manual elapsed tracking and nested conditionals
- Generalized: Cutscenes, tutorials, boss intros, level transitions — all games need sequencing

### Before

```typescript
// IntroOverlayNode.ts — manual elapsed tracking
let elapsed = 0;
let fadingOut = false;

useFrameUpdate((dt) => {
    if (gameState.phase !== 'intro') return;

    elapsed += dt;

    if (!fadingOut && elapsed >= INTRO_DURATION) {
        fadingOut = true;
        el.style.opacity = '0';
        setTimeout(() => {
            gameState.phase = 'countdown';
        }, 400);
    }
});
```

```typescript
// ReplayNode.ts — multi-step sequence with hit detection
let darkFlashOpacity = 0;

useFrameUpdate((dt) => {
    // Step 1: Dark flash on enter
    if (justEnteredReplay) {
        darkFlashOpacity = 1;
    }
    // Step 2: Fade dark flash
    if (darkFlashOpacity > 0) {
        darkFlashOpacity = Math.max(0, darkFlashOpacity - dt * 3);
    }
    // Step 3: Play replay, trigger hits at specific frames...
    // Step 4: Dark flash on exit
    // Step 5: Cleanup
});
```

### After

```typescript
import { useSequence } from '@pulse-ts/effects';

// IntroOverlayNode.ts
const intro = useSequence([
    { action: () => applyStaggeredEntrance([vsLabel, nameLabel, taglineLabel], 200) },
    { delay: INTRO_DURATION },
    { action: () => { el.style.opacity = '0'; } },
    { delay: 0.4 },
    { action: () => { gameState.phase = 'countdown'; } },
]);

useWhen(() => gameState.phase === 'intro', {
    onEnter: () => intro.play(),
});
```

### API Design

```typescript
type SequenceStep =
    | { delay: number }
    | { action: () => void }
    | { action: () => void; delay: number }  // action then wait
    | { parallel: SequenceStep[] };           // run steps concurrently

interface SequenceHandle {
    play(): void;
    reset(): void;
    readonly finished: boolean;
    readonly elapsed: number;
}

/**
 * Declarative time-based sequence of actions and delays.
 * Steps execute in order; `parallel` steps run concurrently.
 * Automatically advances via useFrameUpdate.
 */
function useSequence(steps: SequenceStep[]): SequenceHandle;
```

---

## 13. Tween Hook (`useTween`)

**Package:** `@pulse-ts/effects` (enhancement to existing `useAnimate`)

**Problem:** The existing `useAnimate` supports tweens but requires manual `play()` calls and has no chaining. The arena demo frequently needs fire-and-forget value interpolation: flash a panel brightness from 2.0→1.0, scale a number from 1.35→1.0, fade overlay opacity from 1→0. Currently these use CSS transitions (which have the forced-reflow footgun inside rAF) or manual lerp math. A JS-driven tween would solve the rAF batching issue and provide a consistent API.

**Criteria check:**
- Extensible: Custom easing, onComplete callbacks, chainable
- Better DX: Replaces CSS transitions that have the forced-reflow footgun
- Generalized: Value interpolation is needed in every game with animations

### Before

```typescript
// ScoreHudNode.ts — CSS transition with forced reflow workaround
function flashPanel(panel: HTMLElement, num: HTMLElement): void {
    // Instantly brighten the panel
    panel.style.transition = 'none';
    panel.style.filter = 'brightness(2.0)';

    // Scale-pop the number
    num.style.transition = 'none';
    num.style.transform = 'scale(1.35)';

    // Force reflow so the browser commits the bright/scaled state
    void panel.offsetHeight;

    // Transition back to normal
    panel.style.transition = `filter ${FLASH_DURATION}ms ${ANIM_EASING}`;
    panel.style.filter = 'brightness(1)';

    num.style.transition = `transform ${FLASH_DURATION}ms ${ANIM_EASING}`;
    num.style.transform = 'scale(1)';
}
```

### After

```typescript
import { useTween } from '@pulse-ts/effects';

const panelFlash = useTween({ from: 2.0, to: 1.0, duration: 0.5, easing: 'ease-out' });
const numScale = useTween({ from: 1.35, to: 1.0, duration: 0.5, easing: 'ease-out' });

function flashPanel(panel: HTMLElement, num: HTMLElement): void {
    panelFlash.play((v) => { panel.style.filter = `brightness(${v})`; });
    numScale.play((v) => { num.style.transform = `scale(${v})`; });
}
```

### API Design

```typescript
interface TweenOptions {
    from: number;
    to: number;
    duration: number;
    easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | ((t: number) => number);
}

interface TweenHandle {
    /** Start the tween with an optional per-frame callback. */
    play(onUpdate?: (value: number) => void): void;
    /** Reset to initial state. */
    reset(): void;
    /** Current interpolated value. */
    readonly value: number;
    readonly finished: boolean;
}

function useTween(options: TweenOptions): TweenHandle;
```

---

## 14. Mobile Device Utilities Package

**Package:** `@pulse-ts/core` or new `@pulse-ts/platform` (new package)

**Problem:** The arena demo has 4 separate files implementing mobile device support (`isMobileDevice.ts`, `autoFullscreen.ts`, `landscapeEnforcer.ts`, `installPrompt.ts`). These are not arena-specific — any mobile-targeted game needs device detection, fullscreen management, and orientation locking. Currently each game must copy these utilities.

**Criteria check:**
- Extensible: Individual utilities are opt-in; no mandatory bundle
- Better DX: Import from engine instead of reimplementing per game
- Generalized: Mobile support is needed by all mobile-targeting games

### Before

```typescript
// 4 separate files in demos/arena/src/
import { isMobileDevice } from './isMobileDevice';
import { initAutoFullscreen } from './autoFullscreen';
import { initLandscapeEnforcer } from './landscapeEnforcer';
import { showInstallPrompt } from './installPrompt';

// Called manually in main.ts before world creation
initLandscapeEnforcer();
initAutoFullscreen();
showInstallPrompt();

// Also manually checked throughout:
const mobile = isMobileDevice();
if (mobile) {
    three.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
}
```

### After

```typescript
import { isMobile, installMobileSupport } from '@pulse-ts/platform';

// One call sets up fullscreen, orientation, and install prompt
installMobileSupport({
    fullscreen: true,           // auto-fullscreen on first touch
    orientation: 'landscape',   // lock orientation + show rotate overlay
    installPrompt: true,        // iOS/Android install prompt
});

// Query throughout:
if (isMobile()) {
    three.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
}
```

### API Design

```typescript
/** Detect if the device is touch-primary (mobile/tablet). */
function isMobile(): boolean;

interface MobileSupportOptions {
    /** Request fullscreen on first touch. Default: true. */
    fullscreen?: boolean;
    /** Lock orientation. 'landscape' | 'portrait' | 'any'. Default: 'any'. */
    orientation?: 'landscape' | 'portrait' | 'any';
    /** Show PWA install prompt. Default: false. */
    installPrompt?: boolean;
    /** localStorage key for dismissing install prompt. */
    installPromptDismissKey?: string;
}

/** Initialize mobile support utilities. Returns cleanup function. */
function installMobileSupport(options?: MobileSupportOptions): () => void;
```

---

## 15. Virtual Joystick Hook (`useVirtualJoystick`)

**Package:** `@pulse-ts/input` (new hook)

**Problem:** TouchControlsNode implements a complete virtual joystick from scratch: DOM element creation, touch tracking with IDs, displacement computation, deadzone application, visual feedback, and input injection. This is ~120 lines of boilerplate that any mobile game needs. The touch-to-axis pipeline (track touch → compute displacement → apply deadzone → inject into input system) is identical across games.

**Criteria check:**
- Extensible: Configurable size, deadzone, position, visual style
- Better DX: Replaces 120+ lines of touch tracking boilerplate
- Generalized: Every mobile game with movement needs a virtual joystick

### Before

```typescript
// TouchControlsNode.ts — 120 lines of manual touch handling
const base = document.createElement('div');
Object.assign(base.style, {
    position: 'absolute', bottom: '24px', left: '24px',
    width: '120px', height: '120px', borderRadius: '50%',
    // ... 8 more style properties
});
container.appendChild(base);

const knob = document.createElement('div');
// ... 10 more style properties
base.appendChild(knob);

let joystickTouchId: number | null = null;
let baseRect: DOMRect | null = null;

base.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (joystickTouchId !== null) return;
    const touch = e.changedTouches[0];
    joystickTouchId = touch.identifier;
    baseRect = base.getBoundingClientRect();
    const axes = computeJoystickDisplacement(touch, baseRect, BASE_RADIUS);
    input.holdAxis2D(moveAction, applyDeadzone(axes, DEADZONE));
    knob.style.transform = `translate(${axes.x * MAX_KNOB_OFFSET}px, ${-axes.y * MAX_KNOB_OFFSET}px)`;
    knob.style.backgroundColor = 'rgba(255,255,255,0.7)';
});

// ... touchmove handler (similar)
// ... touchend handler (reset knob, release axis)
// ... touchcancel handler (same as touchend)
```

### After

```typescript
import { useVirtualJoystick } from '@pulse-ts/input';

const joystick = useVirtualJoystick(moveAction, {
    position: 'bottom-left',
    size: 120,
    deadzone: 0.15,
});
```

### API Design

```typescript
interface VirtualJoystickOptions {
    /** Screen position preset. Default: 'bottom-left'. */
    position?: 'bottom-left' | 'bottom-right' | { x: string; y: string };
    /** Outer diameter in pixels. Default: 120. */
    size?: number;
    /** Deadzone radius (0–1). Below this, output is zero. Default: 0.15. */
    deadzone?: number;
    /** Style overrides for base and knob. */
    baseStyle?: Partial<CSSStyleDeclaration>;
    knobStyle?: Partial<CSSStyleDeclaration>;
    /** Parent element. Default: document.body. */
    parent?: HTMLElement;
}

interface VirtualJoystickHandle {
    /** The base DOM element (for custom positioning/visibility). */
    readonly element: HTMLElement;
    /** Current axis values. */
    readonly axes: { x: number; y: number };
    /** Show/hide the joystick. */
    setVisible(visible: boolean): void;
}

/**
 * Creates a virtual joystick that injects into the input system's named axis.
 * Handles touch tracking, deadzone, visual feedback, and cleanup.
 */
function useVirtualJoystick(
    axisAction: string,
    options?: VirtualJoystickOptions,
): VirtualJoystickHandle;
```

---

## 16. Pooled Effect System (`useEffectPool`)

**Package:** `@pulse-ts/effects` (new hook)

**Problem:** The arena demo has 3 separate pooled-slot systems with near-identical architecture: shockwave (4 slots), hit impact (4 slots), and supernova sprites (5 slots). Each manually implements: find first free slot → recycle oldest if full → update ages → deactivate expired. This "fixed-size slot pool with recycling" pattern is fundamental to game effects.

**Criteria check:**
- Extensible: Custom slot data shape, custom update logic, configurable pool size
- Better DX: Eliminates repeated pool management boilerplate
- Generalized: Hit effects, decals, floating text, status effects — all use pools

### Before

```typescript
// hitImpact.ts — manual pool management
const slots: HitImpactSlot[] = Array.from(
    { length: 4 },
    () => ({ active: false, worldX: 0, worldZ: 0, age: 0 }),
);

export function triggerHitImpact(worldX: number, worldZ: number): void {
    let slot = slots.find((s) => !s.active);
    if (!slot) {
        slot = slots.reduce((oldest, s) => (s.age > oldest.age ? s : oldest));
    }
    slot.active = true;
    slot.worldX = worldX;
    slot.worldZ = worldZ;
    slot.age = 0;
}

export function updateHitImpacts(dt: number): void {
    for (const slot of slots) {
        if (!slot.active) continue;
        slot.age += dt;
        if (slot.age >= HIT_IMPACT_DURATION) {
            slot.active = false;
        }
    }
}
```

```typescript
// shockwave.ts — nearly identical pool pattern
const slots = Array.from({ length: 4 }, () => ({ active: false, ... }));

export function triggerShockwave(u: number, v: number): void {
    let slot = slots.find((s) => !s.active);
    if (!slot) {
        slot = slots.reduce((oldest, s) => (s.elapsed > oldest.elapsed ? s : oldest));
    }
    // ... same activate pattern
}
```

### After

```typescript
import { useEffectPool } from '@pulse-ts/effects';

// hitImpact — one line pool setup
const impacts = useEffectPool({
    size: 4,
    duration: 1.2,
    create: () => ({ worldX: 0, worldZ: 0 }),
});

// Trigger from collision handler
impacts.trigger({ worldX: surfX, worldZ: surfZ });

// Read in frame update
for (const slot of impacts.active()) {
    // slot.data.worldX, slot.data.worldZ, slot.age, slot.progress
}
```

### API Design

```typescript
interface EffectPoolOptions<T> {
    /** Maximum concurrent effects. */
    size: number;
    /** Duration in seconds before auto-deactivation. */
    duration: number;
    /** Factory for slot data. */
    create: () => T;
}

interface EffectSlot<T> {
    readonly data: T;
    readonly age: number;
    /** 0→1 normalized progress through duration. */
    readonly progress: number;
    readonly active: boolean;
}

interface EffectPoolHandle<T> {
    /** Activate a slot with the given data. Recycles oldest if full. */
    trigger(data: Partial<T>): void;
    /** Iterate active slots. */
    active(): Iterable<EffectSlot<T>>;
    /** Whether any slot is active. */
    readonly hasActive: boolean;
    /** Reset all slots. */
    reset(): void;
}

/**
 * Fixed-size pool of timed effects with automatic recycling.
 * Ages advance each fixed tick; expired slots auto-deactivate.
 */
function useEffectPool<T>(options: EffectPoolOptions<T>): EffectPoolHandle<T>;
```

---

## 17. Shader Material Hook (`useShaderMaterial`)

**Package:** `@pulse-ts/three` (new hook)

**Problem:** PlatformNode, StarfieldNode, and NebulaNode all create custom shader materials with manual uniform management. PlatformNode patches `MeshStandardMaterial.onBeforeCompile` with string replacement of GLSL includes — a fragile pattern that breaks across Three.js versions. NebulaNode builds fragment shader strings dynamically. These patterns are verbose (100+ lines each), error-prone, and common in any visually rich game.

**Criteria check:**
- Extensible: Supports both full custom shaders and patching standard materials
- Better DX: Type-safe uniform declarations, automatic time uniform, lifecycle management
- Generalized: Any game with custom visuals needs shader material management

### Before

```typescript
// PlatformNode.ts — fragile shader patching (simplified)
const material = new THREE.MeshStandardMaterial({ color: 0x1a1a2e });

material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    shader.uniforms.uRippleRadii = { value: new THREE.Vector4(-1, -1, -1, -1) };
    shader.uniforms.uWakeMap = { value: wakeTexture };

    shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `#include <common>
        uniform float uTime;
        uniform vec4 uRippleRadii;
        uniform sampler2D uWakeMap;`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        `{ /* 40 lines of custom GLSL */ }`
    );

    cachedShader = shader;
};

// Manual uniform updates each frame:
useFrameUpdate((dt) => {
    if (cachedShader) {
        cachedShader.uniforms.uTime.value += dt;
        cachedShader.uniforms.uRippleRadii.value.set(...);
    }
});
```

### After

```typescript
import { useShaderMaterial } from '@pulse-ts/three';

const { material, uniforms } = useShaderMaterial({
    base: 'standard',
    color: 0x1a1a2e,
    uniforms: {
        uTime: { type: 'float', value: 0 },
        uRippleRadii: { type: 'vec4', value: [-1, -1, -1, -1] },
        uWakeMap: { type: 'sampler2D', value: wakeTexture },
    },
    patches: [
        {
            target: 'fragment',
            inject: {
                common: `uniform float uTime; uniform vec4 uRippleRadii; uniform sampler2D uWakeMap;`,
                emissivemap_fragment: `{ /* custom GLSL */ }`,
            },
        },
    ],
});

useFrameUpdate((dt) => {
    uniforms.uTime.value += dt;
    uniforms.uRippleRadii.value.set(...);
});
```

### API Design

```typescript
interface ShaderMaterialOptions {
    /** Base material to extend. 'standard' | 'basic' | 'phong' | 'custom'. */
    base?: 'standard' | 'basic' | 'custom';
    /** Uniform declarations with initial values. */
    uniforms?: Record<string, { type: string; value: unknown }>;
    /** Shader include patches (for extending standard materials). */
    patches?: Array<{
        target: 'vertex' | 'fragment';
        inject: Record<string, string>;  // include name → replacement GLSL
    }>;
    /** Full custom vertex/fragment shaders (for base: 'custom'). */
    vertexShader?: string;
    fragmentShader?: string;
    /** Standard material options (color, roughness, etc.). */
    [key: string]: unknown;
}

function useShaderMaterial(options: ShaderMaterialOptions): {
    material: THREE.Material;
    uniforms: Record<string, THREE.IUniform>;
};
```

---

## 18. Scene Composition Presets (`useEnvironment`)

**Package:** `@pulse-ts/three` (new hook)

**Problem:** ArenaNode and MenuSceneNode both set up identical lighting (ambient + directional + 2 point lights + fog) with the same parameters. This 15-line lighting setup is repeated verbatim. Any game with multiple scenes sharing a visual style (menu, gameplay, pause background) duplicates this. More broadly, the pattern of "set up a standard lighting rig" is universal.

**Criteria check:**
- Extensible: Override individual light parameters; add/remove lights
- Better DX: One-liner for common lighting setups
- Generalized: Every 3D game needs a lighting rig; most have a shared visual style

### Before

```typescript
// ArenaNode.ts — repeated identically in MenuSceneNode
useAmbientLight({ color: 0x2a2a3e, intensity: 0.5 });
useDirectionalLight({
    color: 0xffffff,
    intensity: 0.6,
    position: { x: 5, y: 10, z: 5 },
    castShadow: true,
    shadowMapSize: 1024,
    shadowBounds: { top: 15, bottom: -15, left: -15, right: 15, near: 1, far: 50 },
});
usePointLight({ color: 0x48c9b0, intensity: 0.4, position: { x: -8, y: 3, z: -8 }, distance: 20 });
usePointLight({ color: 0xe74c3c, intensity: 0.3, position: { x: 8, y: 3, z: 8 }, distance: 20 });
useFog({ color: 0x050508, near: 30, far: 80 });
```

### After

```typescript
import { useLightingRig } from '@pulse-ts/three';

// Predefined rig with all 5 lights + fog
useLightingRig({
    ambient: { color: 0x2a2a3e, intensity: 0.5 },
    directional: {
        color: 0xffffff, intensity: 0.6,
        position: { x: 5, y: 10, z: 5 },
        castShadow: true,
    },
    points: [
        { color: 0x48c9b0, intensity: 0.4, position: { x: -8, y: 3, z: -8 } },
        { color: 0xe74c3c, intensity: 0.3, position: { x: 8, y: 3, z: 8 } },
    ],
    fog: { color: 0x050508, near: 30, far: 80 },
});
```

### API Design

```typescript
interface LightingRigOptions {
    ambient?: AmbientLightOptions;
    directional?: DirectionalLightOptions;
    points?: PointLightOptions[];
    fog?: FogOptions;
}

/**
 * Sets up a complete lighting environment in one call.
 * All lights and fog are cleaned up on node destroy.
 */
function useLightingRig(options: LightingRigOptions): void;
```

---

## 19. Interpolation Utilities (`lerp`, `damp`, `smoothstep`)

**Package:** `@pulse-ts/core` (new utilities in math module)

**Problem:** The arena demo manually implements lerp, exponential damping, and smoothstep in numerous places: AtmosphericDustNode uses asymmetric lerp for displacement (attack vs. release rates), RemotePlayerNode uses interpolation lambda for network smoothing, overlay animations use ease curves. These primitives are scattered as inline math. Every game needs them; they should be importable from the engine.

**Criteria check:**
- Extensible: Pure functions, composable, no side effects
- Better DX: Import instead of rewrite; consistent naming
- Generalized: Interpolation is used in every game domain

### Before

```typescript
// AtmosphericDustNode.ts — manual asymmetric lerp
const rate = targetMag > currentMag ? 8 : 2;  // fast attack, slow release
currentX += (targetX - currentX) * Math.min(1, rate * dt);
currentZ += (targetZ - currentZ) * Math.min(1, rate * dt);

// RemotePlayerNode.ts — manual exponential smoothing
const t = 1 - Math.exp(-lambda * dt);
position.x += (target.x - position.x) * t;

// overlayAnimations.ts — hardcoded ease curve
// cubic-bezier(0.16, 1, 0.3, 1)  // exponential ease-out

// shockwave.ts — manual smoothstep
const band = Math.abs(dist - radius);
const falloff = 1 - band / ringWidth;  // linear falloff approximation
```

### After

```typescript
import { lerp, damp, smoothstep, inverseLerp } from '@pulse-ts/core';

// Asymmetric damping
const rate = targetMag > currentMag ? 8 : 2;
currentX = damp(currentX, targetX, rate, dt);
currentZ = damp(currentZ, targetZ, rate, dt);

// Network smoothing
position.x = damp(position.x, target.x, lambda, dt);

// Shader-style smoothstep
const falloff = smoothstep(ringWidth, 0, band);
```

### API Design

```typescript
/** Linear interpolation: a + (b - a) * t */
function lerp(a: number, b: number, t: number): number;

/** Inverse lerp: (value - a) / (b - a), clamped to [0,1] */
function inverseLerp(a: number, b: number, value: number): number;

/** Frame-rate-independent exponential damping. */
function damp(current: number, target: number, rate: number, dt: number): number;

/** Hermite smoothstep: smooth transition from edge0 to edge1. */
function smoothstep(edge0: number, edge1: number, x: number): number;

/** Clamp value between min and max. */
function clamp(value: number, min: number, max: number): number;

/** Remap value from [inMin, inMax] to [outMin, outMax]. */
function remap(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number;
```

---

## 20. Post-Processing Pipeline Hook (`usePostProcessing`)

**Package:** `@pulse-ts/three` (new hook)

**Problem:** `setupPostProcessing.ts` manually creates an EffectComposer, chains RenderPass → UnrealBloomPass → custom ShaderPass → OutputPass, sets tone mapping, and returns the custom pass for manual uniform syncing. This pipeline is not managed by the engine — resize handling, pass ordering, and lifecycle are all manual. Any game with post-processing effects duplicates this setup.

**Criteria check:**
- Extensible: Add/remove passes dynamically; supports custom ShaderPass
- Better DX: Declarative pipeline definition; automatic resize handling
- Generalized: Bloom, vignette, color grading, screen-space effects are used across all genres

### Before

```typescript
// setupPostProcessing.ts — manual pipeline setup
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export function setupPostProcessing(three: ThreeService, opts?: { skipBloom?: boolean }) {
    const composer = new EffectComposer(three.renderer);
    composer.addPass(new RenderPass(three.scene, three.camera));

    if (!opts?.skipBloom) {
        const bloom = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.3, 0.85, 0.4,
        );
        composer.addPass(bloom);
    }

    const shockwavePass = createShockwavePass();
    composer.addPass(shockwavePass);
    composer.addPass(new OutputPass());

    three.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    three.setComposer(composer);

    return shockwavePass;
}
```

### After

```typescript
import { usePostProcessing } from '@pulse-ts/three';

const pipeline = usePostProcessing({
    toneMapping: 'aces',
    passes: [
        !isMobile() && { type: 'bloom', strength: 0.3, radius: 0.85, threshold: 0.4 },
        { type: 'custom', pass: createShockwavePass() },
    ].filter(Boolean),
});

// pipeline.getPass('custom') to access the shockwave pass for uniform syncing
```

### API Design

```typescript
type PassConfig =
    | { type: 'bloom'; strength?: number; radius?: number; threshold?: number }
    | { type: 'custom'; pass: THREE.Pass; name?: string }
    | { type: 'fxaa' }
    | { type: 'vignette'; darkness?: number; offset?: number };

interface PostProcessingOptions {
    toneMapping?: 'aces' | 'reinhard' | 'linear' | 'none';
    passes: PassConfig[];
}

interface PostProcessingHandle {
    /** Get a named custom pass for uniform access. */
    getPass<T extends THREE.Pass>(name: string): T | undefined;
    /** Enable/disable a pass by index or name. */
    setEnabled(nameOrIndex: string | number, enabled: boolean): void;
}

function usePostProcessing(options: PostProcessingOptions): PostProcessingHandle;
```

---

## 21. Design Token System (`defineTheme`)

**Package:** `@pulse-ts/core` (new module)

**Problem:** The arena demo scatters visual constants across 7+ files with no single source of truth. Player colors appear as `0x48c9b0` (hex number) in `arena.ts`, `'#48c9b0'` (CSS string) in `ScoreHudNode`, and `'rgba(72, 201, 176, 0.5)'` (CSS rgba) in `KnockoutOverlayNode`. Button styling is copy-pasted across `PauseMenuNode`, `MatchOverOverlayNode`, and `DisconnectOverlayNode` — identical `Object.assign` blocks with identical colors, borders, radii, and padding. Z-index values (2000–5001) are scattered magic numbers. Any game with a consistent visual language will reproduce this fragmentation.

**Criteria check:**
- Extensible: Themes can be swapped, extended, or overridden per-context
- Better DX: Single source of truth for all visual constants; auto-derived formats
- Generalized: Every game has a visual language (colors, spacing, typography, z-layers)

### Before

```typescript
// ScoreHudNode.ts
const SCORE_COLORS = ['#48c9b0', '#e74c3c'];

// KnockoutOverlayNode.ts
const FLASH_COLORS = ['rgba(72, 201, 176, 0.5)', 'rgba(231, 76, 60, 0.5)'];

// MatchOverOverlayNode.ts
const PLAYER_COLORS = ['#48c9b0', '#e74c3c'];

// arena.ts
export const PLAYER_COLORS = [0x48c9b0, 0xe74c3c];

// PauseMenuNode.ts — button styles (duplicated in 3 files)
Object.assign(btn.style, {
    font: 'bold clamp(14px, 3.5vw, 18px) monospace',
    backgroundColor: 'rgba(255,255,255,0.08)',
    border: '2px solid rgba(255,255,255,0.2)',
    borderRadius: '6px',
    padding: '12px 32px',
    // ...
});
```

### After

```typescript
import { defineTheme, useTheme } from '@pulse-ts/core';

// Define once, derive all formats automatically
const ArenaTheme = defineTheme({
    colors: {
        p1: 0x48c9b0,
        p2: 0xe74c3c,
        background: 0x0a0a1a,
    },
    zLayers: {
        hud: 2000,
        overlay: 4000,
        backdrop: 4500,
        modal: 5000,
    },
    typography: {
        heading: 'bold clamp(28px, 8vw, 48px) monospace',
        body: 'bold clamp(14px, 3.5vw, 18px) monospace',
    },
});

// In any node:
const theme = useTheme(ArenaTheme);
theme.colors.p1.hex;    // '#48c9b0'
theme.colors.p1.num;    // 0x48c9b0
theme.colors.p1.rgb;    // 'rgb(72, 201, 176)'
theme.colors.p1.rgba(0.5); // 'rgba(72, 201, 176, 0.5)'
```

### API Design

```typescript
interface ThemeColors {
    [name: string]: number; // hex number (0xRRGGBB)
}

interface ThemeDef {
    colors?: ThemeColors;
    zLayers?: Record<string, number>;
    typography?: Record<string, string>;
    spacing?: Record<string, string>;
}

interface ResolvedColor {
    readonly num: number;
    readonly hex: string;
    readonly rgb: string;
    rgba(alpha: number): string;
}

type ResolvedTheme<T extends ThemeDef> = {
    colors: { [K in keyof T['colors']]: ResolvedColor };
    zLayers: T['zLayers'];
    typography: T['typography'];
    spacing: T['spacing'];
};

function defineTheme<T extends ThemeDef>(def: T): ThemeDefinition<T>;
function useTheme<T extends ThemeDef>(def: ThemeDefinition<T>): ResolvedTheme<T>;
```

---

## 22. Phase-Gated Update Hook (`usePhaseUpdate`)

**Package:** `@pulse-ts/core` (new hook)

**Problem:** Nearly every `useFixedUpdate` and `useFrameUpdate` callback in the arena demo begins with a phase guard: `if (gameState.phase !== 'playing') return;`. This is the most common single line of code across the demo — appearing in LocalPlayerNode (6 times), RemotePlayerNode (2 times), GameManagerNode (3 times), CameraRigNode, PlatformNode, and every overlay node. The guard is easy to forget, and forgetting it causes subtle bugs (movement during replay, particles during countdown, etc.).

**Criteria check:**
- Extensible: Works with any context value, not just "phase"
- Better DX: Eliminates the most common boilerplate line; makes phase intent explicit
- Generalized: Any game with phases/modes needs conditional update logic

### Before

```typescript
// LocalPlayerNode.ts — movement (one of 6 identical guards)
useFixedUpdate((dt) => {
    if (gameState.phase !== 'playing') return;
    if (gameState.paused) return;

    const { x, y } = getMove();
    body.applyImpulse(x * MOVE_IMPULSE, 0, -y * MOVE_IMPULSE);
});

// LocalPlayerNode.ts — trail emission (another identical guard)
useFrameUpdate((dt) => {
    if (gameState.phase !== 'playing') return;

    const vmag = Math.sqrt(vx * vx + vz * vz);
    // ... trail logic
});

// CameraRigNode.ts — shake (yet another)
useFrameUpdate((dt) => {
    if (gameState.phase !== 'playing' && gameState.phase !== 'countdown') return;

    // ... camera logic
});
```

### After

```typescript
import { usePhaseUpdate } from '@pulse-ts/core';

// Only runs when phase === 'playing' and not paused
usePhaseUpdate('fixed', () => gameState.phase === 'playing' && !gameState.paused, (dt) => {
    const { x, y } = getMove();
    body.applyImpulse(x * MOVE_IMPULSE, 0, -y * MOVE_IMPULSE);
});

// Only runs during playing phase
usePhaseUpdate('frame', () => gameState.phase === 'playing', (dt) => {
    const vmag = Math.sqrt(vx * vx + vz * vz);
    // ... trail logic
});

// Runs during playing OR countdown
usePhaseUpdate('frame', () => ['playing', 'countdown'].includes(gameState.phase), (dt) => {
    // ... camera logic
});
```

### API Design

```typescript
type UpdateKind = 'fixed' | 'frame' | 'fixedEarly' | 'fixedLate';

/**
 * Registers an update callback that only executes when the guard returns true.
 * The guard is evaluated each tick — zero overhead when skipped (no closure allocation).
 */
function usePhaseUpdate(
    kind: UpdateKind,
    guard: () => boolean,
    callback: (dt: number) => void,
    options?: { order?: number },
): void;
```

---

## 23. Collision Response Helper (`useCollisionResponse`)

**Package:** `@pulse-ts/physics` (new hook)

**Problem:** `LocalPlayerNode`'s collision handler is 110 lines of tightly coupled logic: cooldown guard → entity filtering → velocity correction → knockback computation → effect coordination (sound + particles + camera shake + shockwave + replay marking). This "on collision with entity X, apply knockback + effects" pattern is fundamental to any action game, yet the arena demo implements it from scratch with raw physics primitives. The collision-cooldown-guard convention (documented in `.claude/rules/`) is a manual discipline that should be enforced by the API.

**Criteria check:**
- Extensible: Custom knockback formula, configurable effects, entity filtering
- Better DX: Reduces 110-line handler to ~20 lines; enforces cooldown-first pattern
- Generalized: Combat, sports, puzzle — any game with collision knockback

### Before

```typescript
// LocalPlayerNode.ts — 110 lines of collision handling
useOnCollisionStart(({ other }) => {
    if (other === node) return;
    if (!getComponent(other, PlayerTag)) return;
    if (!impactCD.ready) return;  // Must be first guard!

    const otherTransform = getComponent(other, Transform);
    if (!otherTransform) return;

    // 30 lines: online velocity correction
    if (replicate) {
        const cdx = otherTransform.localPosition.x - transform.localPosition.x;
        // ... elastic collision math
    }

    // 10 lines: approach speed + knockback force computation
    const approachSpeed = computeApproachSpeed(/* 6 args */);
    const effectiveForce = KNOCKBACK_BASE + approachSpeed * KNOCKBACK_VELOCITY_SCALE;
    const [ix, iy, iz] = computeKnockback(/* 5 args */);

    // 15 lines: coordinated effects
    body.applyImpulse(ix, iy, iz);
    dashTimer.cancel();
    dashCD.trigger();
    impactSfx.play();
    impactCD.trigger();
    impactBurst([surfX, surfY, surfZ]);
    triggerShockwave(su, sv);
    triggerHitImpact(surfX, surfZ);
    triggerCameraShake(0.3, 0.2);
    markHit();
});
```

### After

```typescript
import { useCollisionResponse } from '@pulse-ts/physics';

useCollisionResponse({
    filter: PlayerTag,              // Only respond to entities with this component
    cooldown: IMPACT_COOLDOWN,      // Enforces cooldown-first guard automatically
    knockback: {
        base: KNOCKBACK_BASE,
        velocityScale: KNOCKBACK_VELOCITY_SCALE,
        upward: 0.3,
    },
    onImpact: ({ point, force, direction }) => {
        impactSfx.play();
        impactBurst(point);
        const [su, sv] = worldToScreen(...point, threeCamera);
        triggerShockwave(su, sv);
        triggerHitImpact(point[0], point[2]);
        triggerCameraShake(0.3, 0.2);
        markHit();
    },
});
```

### API Design

```typescript
interface CollisionResponseOptions {
    /** Component type to filter collisions (only respond to entities with this). */
    filter?: ComponentType;
    /** Cooldown in seconds between responses. Enforced as first guard. */
    cooldown?: number;
    /** Knockback configuration. Omit to handle manually in onImpact. */
    knockback?: {
        base: number;
        velocityScale?: number;
        upward?: number;
    };
    /** Called after knockback is applied (or instead, if knockback is omitted). */
    onImpact?: (event: CollisionImpactEvent) => void;
}

interface CollisionImpactEvent {
    /** World-space contact point. */
    point: [number, number, number];
    /** Computed knockback force magnitude. */
    force: number;
    /** Normalized direction of knockback (away from other entity). */
    direction: [number, number, number];
    /** The other entity involved. */
    other: Entity;
}

function useCollisionResponse(options: CollisionResponseOptions): void;
```

---

## 24. Backdrop / Modal Overlay Primitives (`useBackdrop`, `useModal`)

**Package:** `@pulse-ts/three` (new hooks, extends `useOverlay`)

**Problem:** Three overlay nodes (`PauseMenuNode`, `MatchOverOverlayNode`, `DisconnectOverlayNode`) independently create a dark semi-transparent backdrop with identical CSS: `position: absolute, inset: 0, backgroundColor: rgba(0,0,0,0.7), transition, opacity, pointerEvents`. Each then creates a content wrapper, manages show/hide visibility, and wires up staggered entrance animations on visibility transitions. This "backdrop + content + fade + entrance" pattern is 40-50 lines per overlay, totaling 120-150 lines of near-identical code.

**Criteria check:**
- Extensible: Custom backdrop color/opacity, entrance animation style, z-layer
- Better DX: Replaces 40-50 lines of DOM setup per overlay with a 5-line hook call
- Generalized: Pause menus, game-over screens, dialog boxes, settings panels — universal

### Before

```typescript
// PauseMenuNode.ts — backdrop setup (repeated in 3 files)
const backdrop = document.createElement('div');
Object.assign(backdrop.style, {
    position: 'absolute',
    inset: '0',
    zIndex: '4500',
    backgroundColor: 'rgba(0,0,0,0.7)',
    transition: 'opacity 0.3s ease-in-out',
    opacity: '0',
    pointerEvents: 'none',
});
container.appendChild(backdrop);

const content = document.createElement('div');
Object.assign(content.style, {
    position: 'absolute',
    inset: '0',
    zIndex: '4501',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    transition: 'opacity 0.3s ease-in-out',
    opacity: '0',
    pointerEvents: 'none',
});
container.appendChild(content);

// ... manual visibility toggling in useFrameUpdate
let wasVisible = false;
useFrameUpdate(() => {
    const visible = gameState.paused;
    backdrop.style.opacity = visible ? '1' : '0';
    content.style.opacity = visible ? '1' : '0';
    backdrop.style.pointerEvents = visible ? 'auto' : 'none';
    content.style.pointerEvents = visible ? 'auto' : 'none';
    if (visible && !wasVisible) {
        applyStaggeredEntrance([title, buttonRow], 100);
    }
    wasVisible = visible;
});

useDestroy(() => { backdrop.remove(); content.remove(); });
```

### After

```typescript
import { useModal } from '@pulse-ts/three';

const { content, setVisible } = useModal({
    zLayer: 4500,
    backdrop: { color: 'rgba(0,0,0,0.7)' },
    entrance: 'stagger',     // auto-animates children on show
    layout: 'center-column', // flex column, centered
});

// Add children to content
content.appendChild(title);
content.appendChild(buttonRow);

// In frame update — just toggle visibility
useFrameUpdate(() => {
    setVisible(gameState.paused);
});
```

### API Design

```typescript
interface ModalOptions {
    /** Z-index layer for the backdrop. Content is backdrop + 1. */
    zLayer?: number;
    /** Backdrop configuration. */
    backdrop?: { color?: string; blur?: string };
    /** Entrance animation style. */
    entrance?: 'stagger' | 'fade' | 'scale' | 'none';
    /** Content layout preset. */
    layout?: 'center-column' | 'center-row' | 'custom';
    /** Fade duration in ms. Default: 300. */
    fadeDuration?: number;
}

interface ModalHandle {
    /** The content container element. Append your UI here. */
    readonly content: HTMLElement;
    /** Show or hide the modal with transition. */
    setVisible(visible: boolean): void;
    /** Whether the modal is currently visible. */
    readonly visible: boolean;
}

function useModal(options?: ModalOptions): ModalHandle;
```

---

## 25. Fixed-Step Interpolation Hook (`useInterpolatedPosition`)

**Package:** `@pulse-ts/core` or `@pulse-ts/three` (new hook)

**Problem:** `LocalPlayerNode` manually tracks previous-frame positions and interpolates between them every frame using the world's ambient alpha. This is 15 lines of boilerplate: declare `prevX/prevY/prevZ`, snapshot in `useFixedEarly`, then lerp in `useFrameUpdate` using `world.getAmbientAlpha()`. Every physics-driven entity with a visual representation needs this pattern. The arena has 2 separate implementations (local player, AI player), and any new entity type would need to duplicate it.

**Criteria check:**
- Extensible: Works with any transform source (physics body, replay buffer, network)
- Better DX: Eliminates the most common fixed→frame interpolation boilerplate
- Generalized: Essential for any game using fixed-step physics with variable-rate rendering

### Before

```typescript
// LocalPlayerNode.ts — manual position interpolation
let prevX = spawn[0], prevY = spawn[1], prevZ = spawn[2];

useFixedEarly(() => {
    prevX = transform.localPosition.x;
    prevY = transform.localPosition.y;
    prevZ = transform.localPosition.z;
});

useFrameUpdate(() => {
    const alpha = world.getAmbientAlpha();
    const cur = transform.localPosition;
    root.position.set(
        prevX + (cur.x - prevX) * alpha,
        prevY + (cur.y - prevY) * alpha,
        prevZ + (cur.z - prevZ) * alpha,
    );
});
```

### After

```typescript
import { useInterpolatedPosition } from '@pulse-ts/three';

// Automatically snapshots in fixedEarly, lerps in frameUpdate
useInterpolatedPosition(transform, root);
```

### API Design

```typescript
/**
 * Smoothly interpolates a Three.js Object3D position from a Transform component
 * across fixed-step boundaries. Snapshots the transform each fixed tick and
 * applies alpha-blended interpolation each render frame.
 *
 * @param source - The ECS Transform component (updated in fixed step).
 * @param target - The Three.js Object3D whose position is driven.
 * @param options - Optional configuration.
 */
function useInterpolatedPosition(
    source: Transform,
    target: THREE.Object3D,
    options?: {
        /** Override the alpha source. Default: world.getAmbientAlpha(). */
        getAlpha?: () => number;
        /** Snap to source immediately (skip interpolation) for one frame. */
        snap?: () => boolean;
    },
): void;
```

---

## 26. Entity Prefab Pattern (`definePrefab`)

**Package:** `@pulse-ts/core` (new utility)

**Problem:** `ArenaNode` has three branches for spawning player entities (online, solo, local) with overlapping but slightly different props. The shared configuration (physics, mesh, trail particles) is baked into `LocalPlayerNode`'s 816-line implementation rather than being composable. If a game needs variations of a base entity (e.g., player with/without networking, enemy with different AI, NPC with/without collision), each variation is a separate node or a massive conditional. The function-component model already supports composition, but there's no formalized pattern for "base entity + variant overrides."

**Criteria check:**
- Extensible: Override any prop of the base prefab; compose prefabs together
- Better DX: Define entity templates once, instantiate with variation
- Generalized: Players, enemies, projectiles, pickups — all games have entity variants

### Before

```typescript
// ArenaNode.ts — three branches with overlapping config
if (online) {
    useChild(LocalPlayerNode, {
        playerId: localId,
        moveAction: 'p1Move',
        dashAction: 'p1Dash',
        replicate: true,
    });
    useChild(RemotePlayerNode, { remotePlayerId: remoteId, online: true });
} else if (props?.aiPersonality) {
    useChild(LocalPlayerNode, {
        playerId: 0,
        moveAction: 'p1Move',
        dashAction: 'p1Dash',
        showIndicatorRing: true,
    });
    useChild(AiPlayerNode, {
        playerId: 1,
        moveAction: 'p2Move',
        dashAction: 'p2Dash',
        personality: props.aiPersonality,
    });
} else {
    useChild(LocalPlayerNode, {
        playerId: 0, moveAction: 'p1Move', dashAction: 'p1Dash',
    });
    useChild(LocalPlayerNode, {
        playerId: 1, moveAction: 'p2Move', dashAction: 'p2Dash',
    });
}
```

### After

```typescript
import { definePrefab } from '@pulse-ts/core';

// Define player prefab with default props
const Player = definePrefab(LocalPlayerNode, {
    moveAction: 'p1Move',
    dashAction: 'p1Dash',
});

// Instantiate variants with minimal overrides
if (online) {
    useChild(Player, { playerId: localId, replicate: true });
    useChild(RemotePlayerNode, { remotePlayerId: remoteId, online: true });
} else if (props?.aiPersonality) {
    useChild(Player, { playerId: 0, showIndicatorRing: true });
    useChild(AiPlayerNode, {
        playerId: 1, moveAction: 'p2Move', dashAction: 'p2Dash',
        personality: props.aiPersonality,
    });
} else {
    useChild(Player, { playerId: 0 });
    useChild(Player.with({ moveAction: 'p2Move', dashAction: 'p2Dash' }), { playerId: 1 });
}
```

### API Design

```typescript
interface Prefab<P> {
    /** The underlying FC. */
    readonly fc: FC<P>;
    /** Default props baked into this prefab. */
    readonly defaults: Partial<P>;
    /** Create a new prefab with additional/overridden defaults. */
    with(overrides: Partial<P>): Prefab<P>;
}

/**
 * Create a prefab — an FC with baked-in default props.
 * useChild(prefab, runtimeProps) merges defaults under runtime props.
 */
function definePrefab<P>(fc: FC<P>, defaults: Partial<P>): Prefab<P>;
```

---

## 27. Module Reset Registry (`useModuleReset`)

**Package:** `@pulse-ts/core` (new pattern)

**Problem:** `GameManagerNode` manually calls 7 reset functions at initialization to clear module-scoped singleton state from previous game sessions: `clearRecording()`, `endReplay()`, `resetDashCooldownProgress()`, `resetHitImpacts()`, `resetPlayerPositions()`, `resetCameraShake()`, `resetPlayerVelocity()`. This list must be maintained by hand — adding a new singleton module requires remembering to add its reset call. Missing a reset causes stale-state bugs that only appear on the second game session.

**Criteria check:**
- Extensible: Modules self-register; no central manifest to maintain
- Better DX: Eliminates the fragile manual reset list; impossible to forget
- Generalized: Any game with multiple sessions/levels needs module reset

### Before

```typescript
// GameManagerNode.ts — fragile manual reset list
export function GameManagerNode(props?: Readonly<GameManagerNodeProps>) {
    const gameState = useContext(GameCtx);

    // Clear all module-level state from any previous game session.
    // world.destroy() only tears down ECS — module singletons persist.
    clearRecording();
    endReplay();
    resetDashCooldownProgress();
    resetHitImpacts();
    resetPlayerPositions();
    resetCameraShake();
    resetPlayerVelocity();
    // ← Forgot to add resetShockwave()? Silent bug on rematch.

    // ... rest of game manager
}
```

### After

```typescript
// dashCooldown.ts — self-registers reset
import { useModuleReset } from '@pulse-ts/core';

let progress = 0;
useModuleReset(() => { progress = 0; });  // Auto-called on world init

// hitImpact.ts — self-registers reset
useModuleReset(() => { slots.forEach(s => { s.active = false; }); });

// GameManagerNode.ts — no manual reset calls needed!
export function GameManagerNode(props?: Readonly<GameManagerNodeProps>) {
    const gameState = useContext(GameCtx);
    // Module resets are automatic — handled by the engine on world creation
    // ... rest of game manager
}
```

### API Design

```typescript
/**
 * Register a cleanup function that runs automatically when a new World is created.
 * Use this for module-scoped singletons that persist across world lifecycles.
 *
 * @param resetFn - Called on world.create() before any nodes mount.
 * @returns A dispose function to unregister (rarely needed).
 */
function useModuleReset(resetFn: () => void): () => void;

/**
 * Alternatively, invoke all registered resets manually:
 */
function resetAllModules(): void;
```

---

## 28. Staggered Entrance Animation Hook (`useEntrance`)

**Package:** `@pulse-ts/three` (new hook, extends overlay system)

**Problem:** The `overlayAnimations.ts` utility provides `applyStaggeredEntrance()` and `applyScalePop()` functions, but they're called imperatively from `useFrameUpdate` with manual "was visible" tracking. Every overlay that uses entrance animations has the same pattern: track `wasVisible`, check `visible && !wasVisible`, call `applyStaggeredEntrance(elements, delay)`. This 5-line visibility-transition + animation trigger pattern is duplicated in `PauseMenuNode`, `MatchOverOverlayNode`, `DisconnectOverlayNode`, `CountdownOverlayNode`, and `KnockoutOverlayNode`.

**Criteria check:**
- Extensible: Supports slide, scale-pop, fade, custom entrance styles
- Better DX: Declarative "animate these elements when this becomes true"
- Generalized: Any game with phase-based UI needs entrance animations

### Before

```typescript
// PauseMenuNode.ts (same pattern in 5 overlays)
let wasVisible = false;

useFrameUpdate(() => {
    const visible = gameState.paused;
    backdrop.style.opacity = visible ? '1' : '0';
    content.style.opacity = visible ? '1' : '0';
    backdrop.style.pointerEvents = visible ? 'auto' : 'none';
    content.style.pointerEvents = visible ? 'auto' : 'none';

    if (visible && !wasVisible) {
        applyStaggeredEntrance([title, buttonRow], 100);
    }
    wasVisible = visible;
});
```

### After

```typescript
import { useEntrance } from '@pulse-ts/three';

// Declarative: animate on visibility transition
useEntrance({
    when: () => gameState.paused,
    elements: [title, buttonRow],
    style: 'stagger',    // slide-up + fade, staggered
    baseDelay: 100,
});

// Visibility toggling handled automatically
```

### API Design

```typescript
interface EntranceOptions {
    /** Guard function — entrance triggers on false→true transition. */
    when: () => boolean;
    /** Elements to animate. */
    elements: HTMLElement[] | (() => HTMLElement[]);
    /** Animation style. */
    style?: 'stagger' | 'scale-pop' | 'fade' | 'slide-up';
    /** Delay before first element animates (ms). Default: 200. */
    baseDelay?: number;
    /** Also manage visibility (opacity + pointerEvents). Default: true. */
    manageVisibility?: boolean;
    /** Additional elements whose visibility should be toggled but not animated. */
    backdrop?: HTMLElement[];
}

function useEntrance(options: EntranceOptions): void;
```

---

## 29. Network Player Convenience Hook (`useRemoteEntity`)

**Package:** `@pulse-ts/network` (new hook)

**Problem:** `RemotePlayerNode` spends 8 lines on network identity boilerplate that's identical for any networked entity: `useStableId(id)` → `useReplicateTransform({ role: 'consumer', lambda })` → `const interp = world.getService(InterpolationService)` → `interp.getTargetVelocity(stableId)`. Similarly, `LocalPlayerNode` does: `useStableId(id)` → `useReplicateTransform({ role: 'producer' })`. This setup is required for every replicated entity, and the `InterpolationService` import + service lookup is especially verbose.

**Criteria check:**
- Extensible: Configurable role, lambda, velocity access
- Better DX: One-liner for "this entity is replicated over the network"
- Generalized: Any networked game with replicated entities

### Before

```typescript
// RemotePlayerNode.ts — network identity setup
const stableId = `player-${remotePlayerId}`;
useStableId(stableId);
useReplicateTransform({ role: 'consumer', lambda: 25 });

// Later: accessing interpolated velocity
const interp = world.getService(InterpolationService);
const rv = interp?.getTargetVelocity(stableId);
if (rv) {
    setPlayerVelocity(remotePlayerId, rv.x, rv.z);
}
```

```typescript
// LocalPlayerNode.ts — producer side
const stableId = `player-${playerId}`;
useStableId(stableId);
useReplicateTransform({ role: 'producer' });
```

### After

```typescript
// RemotePlayerNode.ts
const remote = useRemoteEntity(`player-${remotePlayerId}`, { lambda: 25 });

// Access interpolated velocity directly
const rv = remote.targetVelocity;
if (rv) setPlayerVelocity(remotePlayerId, rv.x, rv.z);
```

```typescript
// LocalPlayerNode.ts
useLocalEntity(`player-${playerId}`);
```

### API Design

```typescript
interface RemoteEntityHandle {
    /** The stable ID used for replication. */
    readonly stableId: string;
    /** Current target velocity from the interpolation service (may be null). */
    readonly targetVelocity: { x: number; y: number; z: number } | null;
    /** Current target position from the interpolation service. */
    readonly targetPosition: { x: number; y: number; z: number } | null;
}

/**
 * Sets up a consumer-side replicated entity: assigns stable ID,
 * configures transform replication as consumer, and provides
 * convenient access to interpolation data.
 */
function useRemoteEntity(stableId: string, options?: {
    lambda?: number;
}): RemoteEntityHandle;

/**
 * Sets up a producer-side replicated entity: assigns stable ID
 * and configures transform replication as producer.
 */
function useLocalEntity(stableId: string): void;
```

---

## 30. Round Reset Hook (`useRoundReset`)

**Package:** `@pulse-ts/core` (new hook)

**Problem:** Both `LocalPlayerNode` and `RemotePlayerNode` independently track the round number to detect round transitions and snap entities back to spawn positions. The pattern is identical: `let lastRound = gameState.round` → check in `useFixedUpdate` → `if (gameState.round !== lastRound)` → reset position + state. `LocalPlayerNode` does this with a `useWatch`-style check, and `RemotePlayerNode` has its own copy. Any new entity type that needs round-reset behavior (projectiles returning to pool, pickups respawning, environmental hazards resetting) would duplicate this pattern.

**Criteria check:**
- Extensible: Custom reset logic per entity; works with any "round" concept (levels, waves, phases)
- Better DX: Declarative "do X when round changes" without manual tracking
- Generalized: Round-based games, wave-based games, level transitions — all need entity reset

### Before

```typescript
// LocalPlayerNode.ts — round reset detection
let lastRound = gameState.round;

useFixedUpdate(() => {
    if (gameState.round !== lastRound) {
        lastRound = gameState.round;
        // Snap to spawn
        transform.localPosition.set(...spawn);
        body.linearVelocity.set(0, 0, 0);
        body.angularVelocity.set(0, 0, 0);
        root.visible = true;
        isDead = false;
    }
});

// RemotePlayerNode.ts — identical pattern, different reset
let lastRound = gameState.round;

useFixedUpdate(() => {
    if (gameState.round !== lastRound) {
        lastRound = gameState.round;
        transform.localPosition.set(...spawn);
        root.visible = true;
    }
});
```

### After

```typescript
import { useWatch } from '@pulse-ts/core'; // (improvement #5)

// Both nodes — declarative round reset using useWatch
useWatch(() => gameState.round, () => {
    transform.localPosition.set(...spawn);
    body.linearVelocity.set(0, 0, 0);
    body.angularVelocity.set(0, 0, 0);
    root.visible = true;
    isDead = false;
});
```

> **Note:** This improvement is largely solved by **improvement #5 (`useWatch`)**, which provides the general-purpose value-change detection hook. The round-reset pattern is the most common use case for `useWatch`, validating its importance. No additional API is needed — `useWatch` is sufficient.

---

## 31. Scene / Screen Flow Manager (`useScreen`)

**Package:** `@pulse-ts/core` (new module)

**Problem:** The arena's top-level orchestration in `main.ts` follows a promise-based screen flow: `showMainMenu()` → await choice → `showLobby()` → await connection → mount `ArenaNode` → await match end → loop. Each screen function returns a `Promise` that resolves when the user makes a choice, then manually tears down its DOM and resolves. `menu.ts` is 218 lines of DOM creation + button wiring + transition cleanup for what is conceptually "show 3 buttons, return which was clicked." `lobby.ts` is 845 lines managing 6 sub-screens with manual state transitions. This "show a screen, await result, tear down" pattern has no engine support.

**Criteria check:**
- Extensible: Supports arbitrary screen types with typed return values
- Better DX: Declarative screen definitions with automatic lifecycle management
- Generalized: Every game has screens: main menu, settings, pause, game over, lobby, loading

### Before

```typescript
// menu.ts — 218 lines for a 3-button menu
export function showMainMenu(container: HTMLElement): Promise<MenuChoice> {
    return new Promise((resolve) => {
        const overlay = createOverlay();       // 15 lines
        const title = createTitle();           // 25 lines
        const subtitle = createSubtitle();     // 10 lines
        const btnSolo = createButton('Solo Play', '#f1c40f');  // 40 lines
        const btnLocal = createButton('Local Play', '#48c9b0');
        const btnOnline = createButton('Online Play', '#e74c3c');
        const buttonRow = createButtonRow(btnSolo, btnLocal, btnOnline);

        overlay.appendChild(title);
        overlay.appendChild(subtitle);
        overlay.appendChild(buttonRow);
        container.appendChild(overlay);

        requestAnimationFrame(() => { overlay.style.opacity = '1'; });
        applyStaggeredEntrance([title, subtitle, buttonRow], 200);

        function pick(choice: MenuChoice) {
            overlay.style.opacity = '0';
            overlay.addEventListener('transitionend', () => {
                overlay.remove();
                resolve(choice);
            });
        }

        btnSolo.addEventListener('click', () => pick('solo'));
        btnLocal.addEventListener('click', () => pick('local'));
        btnOnline.addEventListener('click', () => pick('online'));
    });
}

// main.ts — manual flow orchestration
async function gameLoop() {
    while (true) {
        const choice = await showMainMenu(container);
        if (choice === 'online') {
            const result = await showLobby(container);
            await startOnlineGame(result);
        } else if (choice === 'solo') {
            const personality = await showSoloMenu(container);
            await startSoloGame(personality);
        } else {
            await startLocalGame();
        }
    }
}
```

### After

```typescript
import { defineScreen, useScreenFlow } from '@pulse-ts/core';

const MainMenu = defineScreen<MenuChoice>({
    layout: 'center-column',
    entrance: 'stagger',
    content: ({ resolve }) => [
        { type: 'title', text: 'BUMPER BALLS' },
        { type: 'subtitle', text: 'ARENA' },
        { type: 'button', label: 'Solo Play', color: '#f1c40f', onClick: () => resolve('solo') },
        { type: 'button', label: 'Local Play', color: '#48c9b0', onClick: () => resolve('local') },
        { type: 'button', label: 'Online Play', color: '#e74c3c', onClick: () => resolve('online') },
    ],
});

// Usage — flow reads like a script
const flow = useScreenFlow(container);
const choice = await flow.show(MainMenu);
```

### API Design

```typescript
interface ScreenDefinition<T> {
    layout?: 'center-column' | 'center-row' | 'custom';
    entrance?: 'stagger' | 'fade' | 'none';
    backdrop?: { color?: string };
    content: (ctx: ScreenContext<T>) => ScreenElement[] | HTMLElement;
}

interface ScreenContext<T> {
    resolve(value: T): void;
    container: HTMLElement;
}

interface ScreenFlow {
    show<T>(screen: ScreenDefinition<T>): Promise<T>;
    /** Dismiss the current screen without a result. */
    dismiss(): void;
}

function defineScreen<T>(def: ScreenDefinition<T>): ScreenDefinition<T>;
function useScreenFlow(container: HTMLElement): ScreenFlow;
```

---

## 32. Temporal Ring Buffer (`RingBuffer<T>`)

**Package:** `@pulse-ts/core` (new data structure utility)

**Problem:** The arena's instant replay system (`replay.ts`, 500 lines) manually implements a ring buffer with write pointer, modular indexing, snapshot extraction, and interpolated queries. This is a well-known data structure used for replay systems, network jitter buffers, input history, undo stacks, and performance monitoring. The arena implements it from scratch with hardcoded frame layout (`p0x, p0y, p0z, p1x, p1y, p1z`) — not reusable for any other data shape.

**Criteria check:**
- Extensible: Generic type parameter; custom serialization
- Better DX: Built-in snapshot, query, and interpolation methods
- Generalized: Replay, network jitter buffers, input history, undo — all need ring buffers

### Before

```typescript
// replay.ts — manual ring buffer with hardcoded frame type
const buffer: ReplayFrame[] = [];
let writeCount = 0;

export function recordFrame(p0x, p0y, p0z, p1x, p1y, p1z): void {
    const idx = writeCount % BUFFER_SIZE;
    if (buffer.length <= idx) {
        buffer.push({ p0x, p0y, p0z, p1x, p1y, p1z });
    } else {
        const f = buffer[idx];
        f.p0x = p0x; f.p0y = p0y; f.p0z = p0z;
        f.p1x = p1x; f.p1y = p1y; f.p1z = p1z;
    }
    writeCount++;
}

// Manual snapshot extraction
export function startReplay(knockedOutPlayerId: number): void {
    const frameCount = Math.min(writeCount, BUFFER_SIZE);
    playbackFrames = [];
    const startWrite = writeCount - frameCount;
    for (let i = 0; i < frameCount; i++) {
        const bufIdx = (startWrite + i) % BUFFER_SIZE;
        playbackFrames.push({ ...buffer[bufIdx] });
    }
}

// Manual interpolated query
export function getReplayPosition(playerId: number): [number, number, number] | null {
    const i0 = Math.floor(idx);
    const i1 = Math.min(i0 + 1, playbackFrames.length - 1);
    const t = idx - i0;
    return [f0.x + (f1.x - f0.x) * t, ...];
}
```

### After

```typescript
import { RingBuffer } from '@pulse-ts/core';

const buffer = new RingBuffer<ReplayFrame>(BUFFER_SIZE);

// Record
buffer.push({ p0x, p0y, p0z, p1x, p1y, p1z });

// Snapshot for playback
const snapshot = buffer.snapshot();  // chronological copy

// Interpolated query
const frame = snapshot.lerp(cursorPos, (a, b, t) => ({
    p0x: a.p0x + (b.p0x - a.p0x) * t,
    // ...
}));
```

### API Design

```typescript
class RingBuffer<T> {
    constructor(capacity: number);
    /** Number of items written (may exceed capacity). */
    readonly writeCount: number;
    /** Number of items currently stored (min of writeCount, capacity). */
    readonly length: number;
    /** Push a new item, overwriting the oldest if full. */
    push(item: T): void;
    /** Read the item at logical index (0 = oldest stored). */
    at(index: number): T;
    /** Extract stored items in chronological order (copies). */
    snapshot(): RingBufferSnapshot<T>;
    /** Clear all items. */
    clear(): void;
}

class RingBufferSnapshot<T> {
    readonly length: number;
    at(index: number): T;
    /** Interpolate between frames at a floating-point index. */
    lerp(position: number, interpolate: (a: T, b: T, t: number) => T): T;
    /** Find the index nearest to where a predicate changes from false to true. */
    findTransition(predicate: (item: T) => boolean): number;
}
```

---

## 33. `useMesh` Material Extensions (Texture Maps & Material Type)

**Package:** `@pulse-ts/three` (enhancement to existing `useMesh`)

**Problem:** `useMesh` only exposes 7 `MeshStandardMaterial` properties: `color`, `roughness`, `metalness`, `emissive`, `emissiveIntensity`, `transparent`, `opacity`. Missing are: `map` (diffuse texture), `normalMap`, `emissiveMap`, `roughnessMap`, `metalnessMap`, `envMap`, `alphaMap`, `side`, `depthWrite`, `blending`, and alternative material types. In the arena demo, PlatformNode creates materials manually to use `emissiveMap` and `normalMap` — 40+ lines of workaround. StarfieldNode and NebulaNode bypass `useMesh` entirely to use `ShaderMaterial` and `Points`. Any visually rich game hits this ceiling immediately.

**Criteria check:**
- Extensible: Supports all PBR map slots + alternative material types
- Better DX: No need to drop down to raw Three.js for textured surfaces
- Generalized: Textured materials are the norm, not the exception

### Before

```typescript
// PlatformNode.ts — bypassing useMesh for texture support
const platformGeometry = new THREE.CylinderGeometry(PLATFORM_RADIUS, ...);
const platformMat = new THREE.MeshStandardMaterial({
    color: PLATFORM_COLOR,
    roughness: 0.65,
    metalness: 0.2,
    emissive: GRID_EMISSIVE_COLOR,
    emissiveIntensity: GRID_EMISSIVE_INTENSITY,
    emissiveMap: gridEmissiveMap,    // <-- not available in useMesh
    normalMap: gridNormalMap,         // <-- not available in useMesh
    normalScale: new THREE.Vector2(0.3, 0.3),
});
const platformMesh = new THREE.Mesh(platformGeometry, platformMat);
useObject3D(platformMesh);
```

### After

```typescript
import { useMesh } from '@pulse-ts/three';

const { root, material } = useMesh('cylinder', {
    radiusTop: PLATFORM_RADIUS,
    radiusBottom: PLATFORM_RADIUS,
    height: PLATFORM_HEIGHT,
    color: PLATFORM_COLOR,
    roughness: 0.65,
    metalness: 0.2,
    emissive: GRID_EMISSIVE_COLOR,
    emissiveIntensity: GRID_EMISSIVE_INTENSITY,
    emissiveMap: gridEmissiveMap,    // Now supported
    normalMap: gridNormalMap,         // Now supported
    normalScale: [0.3, 0.3],
    receiveShadow: true,
});
```

### API Design

```typescript
interface MeshMaterialOptions {
    // Existing:
    color?: number;
    roughness?: number;
    metalness?: number;
    emissive?: number;
    emissiveIntensity?: number;
    transparent?: boolean;
    opacity?: number;

    // New — texture maps:
    map?: THREE.Texture;
    normalMap?: THREE.Texture;
    normalScale?: [number, number];
    emissiveMap?: THREE.Texture;
    roughnessMap?: THREE.Texture;
    metalnessMap?: THREE.Texture;
    alphaMap?: THREE.Texture;
    envMap?: THREE.Texture;

    // New — render state:
    side?: 'front' | 'back' | 'double';
    depthWrite?: boolean;
    blending?: 'normal' | 'additive' | 'multiply';

    // New — material type:
    materialType?: 'standard' | 'basic' | 'phong';
}
```

---

## 34. Timer Completion Callbacks (`useTimer` / `useCooldown` enhancement)

**Package:** `@pulse-ts/core` (enhancement to existing hooks)

**Problem:** `useTimer` and `useCooldown` provide state (`active`, `elapsed`, `remaining`, `ready`) but no completion callback. Every timer usage in the arena demo polls state in `useFixedUpdate`: `if (timer.active && timer.remaining <= 0)` or `if (cooldown.ready)`. GameManagerNode has 4 separate timer-polling blocks for countdown phases. The "do X when timer expires" pattern is the primary use case, yet it requires a frame-update poll instead of a declarative callback.

**Criteria check:**
- Extensible: Multiple callbacks per timer; chainable
- Better DX: Eliminates polling boilerplate — "when done, do X"
- Generalized: Timers with completion callbacks are fundamental to every game

### Before

```typescript
// GameManagerNode.ts — polling timer completion
const countdownTimer = useTimer(COUNTDOWN_DURATION);

useFixedUpdate((dt) => {
    if (gameState.phase === 'countdown') {
        if (!countdownTimer.active) {
            countdownTimer.reset();
        }
        gameState.countdownValue = computeCountdownValue(countdownTimer.remaining);

        // Check if complete — must poll every frame
        if (countdownTimer.remaining <= 0) {
            gameState.phase = 'playing';
            gameState.countdownValue = -1;
        }
    }
});
```

```typescript
// LocalPlayerNode.ts — polling cooldown ready state
const dashCD = useCooldown(DASH_COOLDOWN);

useFixedUpdate(() => {
    // Must poll cooldown to update HUD progress
    setDashCooldownProgress(playerId, dashCD.remaining / DASH_COOLDOWN);
});
```

### After

```typescript
// GameManagerNode.ts — declarative completion
const countdownTimer = useTimer(COUNTDOWN_DURATION, {
    onComplete: () => {
        gameState.phase = 'playing';
        gameState.countdownValue = -1;
    },
    onTick: (remaining) => {
        gameState.countdownValue = computeCountdownValue(remaining);
    },
});

// Start when entering countdown phase
countdownTimer.reset();
```

```typescript
// LocalPlayerNode.ts — cooldown with progress callback
const dashCD = useCooldown(DASH_COOLDOWN, {
    onProgress: (remaining, duration) => {
        setDashCooldownProgress(playerId, remaining / duration);
    },
    onReady: () => {
        // Optional: flash HUD indicator
    },
});
```

### API Design

```typescript
interface TimerOptions {
    /** Called once when the timer reaches its duration. */
    onComplete?: () => void;
    /** Called each fixed tick while active. */
    onTick?: (remaining: number, elapsed: number) => void;
}

interface CooldownOptions {
    /** Called once when the cooldown becomes ready. */
    onReady?: () => void;
    /** Called each fixed tick while cooling down. */
    onProgress?: (remaining: number, duration: number) => void;
}

function useTimer(duration: number, options?: TimerOptions): TimerHandle;
function useCooldown(duration: number, options?: CooldownOptions): CooldownHandle;
```

---

## 35. Marker Component Factory (`defineComponent`)

**Package:** `@pulse-ts/core` (new utility)

**Problem:** Custom components require creating a class that extends `Component`, even when the component is a pure marker (tag) with no data. The arena demo's `PlayerTag` is an entire file for `export class PlayerTag extends Component {}`. More complex typed components (health, score, inventory) don't have a clean factory pattern — the `State` component uses string keys with `unknown` values, losing type safety. Creating a component with typed initial data requires a boilerplate class with constructor + properties.

**Criteria check:**
- Extensible: Supports marker tags, typed data components, and custom lifecycle
- Better DX: One-liner for marker components; typed factory for data components
- Generalized: Every game defines custom components

### Before

```typescript
// components/PlayerTag.ts — entire file for a marker
import { Component } from '@pulse-ts/core';
export class PlayerTag extends Component {}

// Typed component — verbose class
import { Component } from '@pulse-ts/core';
export class Health extends Component {
    current = 100;
    max = 100;
    regenerating = false;
}

// Usage with State component — untyped
const [getScore, setScore] = useState('score', 0);
// Typo 'scroe' compiles but silently breaks
```

### After

```typescript
import { defineComponent, defineTag } from '@pulse-ts/core';

// Marker tag — one line
export const PlayerTag = defineTag('PlayerTag');

// Typed data component — factory with defaults
export const Health = defineComponent('Health', {
    current: 100,
    max: 100,
    regenerating: false,
});

// Usage
const health = useComponent(Health);
health.current -= 10;      // ← fully typed
health.regenerating = true; // ← IDE autocomplete
```

### API Design

```typescript
/**
 * Create a marker component (tag) with no data.
 * The returned value can be used with useComponent, getComponent, defineQuery.
 */
function defineTag(name: string): ComponentType;

/**
 * Create a typed data component with default values.
 * Each instance gets a fresh copy of defaults.
 */
function defineComponent<T extends Record<string, unknown>>(
    name: string,
    defaults: T,
): TypedComponentType<T>;

// TypedComponentType is usable everywhere ComponentType is:
// useComponent(Health) → returns typed instance
// getComponent(node, Health) → returns typed instance | undefined
// defineQuery([Health, PlayerTag]) → query for nodes with both
```

---

## 36. Audio Mixing Groups (`useSoundGroup`)

**Package:** `@pulse-ts/audio` (new hook)

**Problem:** The audio package has only master volume on `AudioService` — no way to independently control SFX vs music vs UI sound volumes. The arena demo has 7+ `useSound` calls across 3 files, all with hardcoded `gain` values. A settings menu that lets players adjust "effects volume" vs "music volume" would require manually tracking every sound handle and scaling their gains. This is the #1 audio feature request in game engines.

**Criteria check:**
- Extensible: Arbitrary named groups; nested groups for sub-mixing
- Better DX: Declare group membership at sound creation; control via single knob
- Generalized: Every game with audio needs volume mixing (SFX, music, ambience, UI)

### Before

```typescript
// LocalPlayerNode.ts — all sounds at fixed gain, no group control
const dashSfx = useSound('noise', { ..., gain: 0.12 });
const impactSfx = useSound('tone', { ..., gain: 0.15 });
const deathSfx = useSound('tone', { ..., gain: 0.2 });

// GameManagerNode.ts — more sounds, same flat structure
const beepSfx = useSound('tone', { ..., gain: 0.1 });
const goSfx = useSound('tone', { ..., gain: 0.15 });
const koSfx = useSound('arpeggio', { ..., gain: 0.08 });
const fanfareSfx = useSound('arpeggio', { ..., gain: 0.12 });

// Settings: "mute sound effects"? Must find and update 7 handles.
```

### After

```typescript
import { useSoundGroup, useSound } from '@pulse-ts/audio';

// Define mixing groups (once per world)
const sfx = useSoundGroup('sfx', { volume: 0.8 });
const music = useSoundGroup('music', { volume: 0.5 });

// Sounds automatically route through their group
const dashSfx = useSound('noise', { ..., gain: 0.12, group: 'sfx' });
const impactSfx = useSound('tone', { ..., gain: 0.15, group: 'sfx' });

// Settings: mute all SFX with one call
sfx.setVolume(0);
```

### API Design

```typescript
interface SoundGroupOptions {
    /** Initial volume (0–1). Default: 1. */
    volume?: number;
    /** Whether the group starts muted. Default: false. */
    muted?: boolean;
}

interface SoundGroupHandle {
    readonly name: string;
    readonly volume: number;
    readonly muted: boolean;
    setVolume(volume: number): void;
    setMuted(muted: boolean): void;
}

/** Create or access a named sound group. Groups persist across world lifecycles. */
function useSoundGroup(name: string, options?: SoundGroupOptions): SoundGroupHandle;

// Extended useSound options:
interface SoundOptions {
    // ... existing options
    /** Route this sound through a mixing group. */
    group?: string;
}
```

---

## 37. Input Binding Shorthand (`Axis2D` simplification)

**Package:** `@pulse-ts/input` (enhancement to existing builders)

**Problem:** `Axis2D` binding declarations require nested `Axis1D` + `Key` calls, making the most common input pattern (WASD movement) 5 lines of deeply nested constructor calls. Every game with movement has this pattern, and the verbosity is disproportionate to the simplicity of the concept.

**Criteria check:**
- Extensible: Shorthand coexists with full form; all existing options still available
- Better DX: 1 line for WASD instead of 5
- Generalized: WASD/arrow movement is the most common input binding in games

### Before

```typescript
// config/bindings.ts — verbose nested constructors
export const allBindings = {
    p1Move: Axis2D({
        x: Axis1D({ pos: Key('KeyD'), neg: Key('KeyA') }),
        y: Axis1D({ pos: Key('KeyW'), neg: Key('KeyS') }),
    }),
    p1Dash: Key('Space'),
    p2Move: Axis2D({
        x: Axis1D({ pos: Key('ArrowRight'), neg: Key('ArrowLeft') }),
        y: Axis1D({ pos: Key('ArrowUp'), neg: Key('ArrowDown') }),
    }),
    p2Dash: Key('Enter'),
    pause: Key('Escape'),
};
```

### After

```typescript
// config/bindings.ts — shorthand for common patterns
export const allBindings = {
    p1Move: Axis2D.keys('KeyA', 'KeyD', 'KeyS', 'KeyW'),  // left, right, down, up
    p1Dash: Key('Space'),
    p2Move: Axis2D.keys('ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp'),
    p2Dash: Key('Enter'),
    pause: Key('Escape'),
};
```

### API Design

```typescript
// New static shorthand on Axis2D:
namespace Axis2D {
    /**
     * Create a 2D axis from four key codes: left, right, down, up.
     * Equivalent to Axis2D({ x: Axis1D({ neg: Key(left), pos: Key(right) }),
     *                         y: Axis1D({ neg: Key(down), pos: Key(up) }) })
     */
    function keys(
        left: string, right: string,
        down: string, up: string,
    ): Axis2DBinding;

    /** Create from WASD preset. */
    function wasd(): Axis2DBinding;

    /** Create from arrow keys preset. */
    function arrows(): Axis2DBinding;
}
```

---

## 38. Custom Geometry Hook (`useCustomGeometry`)

**Package:** `@pulse-ts/three` (new hook)

**Problem:** `useMesh` only supports 9 predefined geometry types. The arena demo has 4 nodes that create custom geometry manually: PlatformNode (layered cylinders with texture maps), StarfieldNode (Points with random positions + twinkle attributes), NebulaNode (PlaneGeometry with custom shader), EnergyPillarsNode (programmatically sized boxes). Each bypasses `useMesh` entirely, using raw `new THREE.BufferGeometry()` + `useObject3D()` — losing the convenience of automatic lifecycle cleanup, shadow config, and material setup.

**Criteria check:**
- Extensible: Any BufferGeometry + any material configuration
- Better DX: Lifecycle management, shadow config, material setup — all automatic
- Generalized: Custom geometry is required for any visually distinctive game

### Before

```typescript
// StarfieldNode.ts — manual geometry + points creation
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(count * 3);
const twinklePhases = new Float32Array(count);
const twinkleSpeeds = new Float32Array(count);

for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * FIELD_RADIUS * 2;
    positions[i * 3 + 1] = Math.random() * FIELD_HEIGHT;
    positions[i * 3 + 2] = (Math.random() - 0.5) * FIELD_RADIUS * 2;
    twinklePhases[i] = Math.random() * Math.PI * 2;
    twinkleSpeeds[i] = 0.5 + Math.random() * 1.5;
}

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('aPhase', new THREE.BufferAttribute(twinklePhases, 1));
geometry.setAttribute('aSpeed', new THREE.BufferAttribute(twinkleSpeeds, 1));

const material = new THREE.ShaderMaterial({ ... });
const points = new THREE.Points(geometry, material);
useObject3D(points);
```

### After

```typescript
import { useCustomMesh } from '@pulse-ts/three';

const { root } = useCustomMesh({
    geometry: (THREE) => {
        const geo = new THREE.BufferGeometry();
        // ... same attribute setup
        return geo;
    },
    material: (THREE) => new THREE.ShaderMaterial({ ... }),
    type: 'points',  // 'mesh' | 'points' | 'line'
});
```

### API Design

```typescript
interface CustomMeshOptions {
    /** Factory function that creates the geometry. */
    geometry: (THREE: typeof import('three')) => THREE.BufferGeometry;
    /** Factory function that creates the material. */
    material: (THREE: typeof import('three')) => THREE.Material;
    /** Object type. Default: 'mesh'. */
    type?: 'mesh' | 'points' | 'line' | 'lineSegments';
    /** Shadow options (only for 'mesh' type). */
    castShadow?: boolean;
    receiveShadow?: boolean;
}

interface CustomMeshResult {
    root: THREE.Object3D;
    object: THREE.Mesh | THREE.Points | THREE.Line;
    material: THREE.Material;
    geometry: THREE.BufferGeometry;
}

function useCustomMesh(options: CustomMeshOptions): CustomMeshResult;
```

---

## 39. Network Clock Sync Utilities (`useSyncedTimer`)

**Package:** `@pulse-ts/network` (new hook)

**Problem:** GameManagerNode spends 30 lines implementing an RTT-compensated countdown handshake: host sends countdown-start with timestamp → non-host acks → host measures RTT → host fast-forwards its own timer by RTT/2 so both sides expire at the same absolute moment. This pattern is manually wired across 2 channels (`CountdownStartChannel`, `CountdownAckChannel`) with 6 mutable closure variables. Any networked game that needs synchronized timers (race start, turn timers, bomb fuses, ability cooldowns) would duplicate this exact pattern.

**Criteria check:**
- Extensible: Works with any duration; supports pause/resume across the network
- Better DX: One hook instead of 30 lines of channel wiring
- Generalized: Synchronized timers are fundamental to networked multiplayer

### Before

```typescript
// GameManagerNode.ts — 30 lines of manual RTT compensation
let publishCountdownStart: ((round: number) => void) | null = null;
let publishCountdownAck: ((round: number) => void) | null = null;
let hostCountdownStarted = false;
let countdownStartSentAt = 0;
let countdownFastForward = 0;
let hostAckReceived = false;

const cs = useChannel(CountdownStartChannel, (round) => {
    if (!props?.isHost) {
        hostCountdownStarted = true;
        publishCountdownAck!(round);
    }
});
publishCountdownStart = (round) => cs.publish(round);

const ca = useChannel(CountdownAckChannel, () => {
    if (props?.isHost && countdownStartSentAt > 0) {
        const rtt = performance.now() - countdownStartSentAt;
        countdownFastForward = rtt / 2 / 1000;
        hostAckReceived = true;
        countdownStartSentAt = 0;
    }
});
publishCountdownAck = (round) => ca.publish(round);
```

### After

```typescript
import { useSyncedTimer } from '@pulse-ts/network';

const countdown = useSyncedTimer('countdown', {
    duration: COUNTDOWN_DURATION,
    isHost: props?.isHost,
    onComplete: () => {
        gameState.phase = 'playing';
    },
    onTick: (remaining) => {
        gameState.countdownValue = computeCountdownValue(remaining);
    },
});

// Host starts countdown — RTT compensation is automatic
countdown.start();
```

### API Design

```typescript
interface SyncedTimerOptions {
    /** Timer duration in seconds. */
    duration: number;
    /** Whether this peer is the host (initiator). */
    isHost?: boolean;
    /** Called once when timer expires (synchronized across peers). */
    onComplete?: () => void;
    /** Called each tick with remaining time. */
    onTick?: (remaining: number) => void;
}

interface SyncedTimerHandle {
    /** Host: broadcast start signal with RTT compensation. */
    start(): void;
    /** Seconds remaining (RTT-adjusted on both sides). */
    readonly remaining: number;
    /** Whether the timer is currently running. */
    readonly active: boolean;
}

/**
 * Creates a timer that synchronizes expiration across networked peers
 * using RTT measurement. Host sends start signal, non-host acks,
 * host fast-forwards by RTT/2 so both expire simultaneously.
 */
function useSyncedTimer(name: string, options: SyncedTimerOptions): SyncedTimerHandle;
```

---

## 40. Collision Filter Hook (`useOnCollisionStartFiltered`)

**Package:** `@pulse-ts/physics` (enhancement to existing hooks)

**Problem:** Every `useOnCollisionStart` handler in the arena demo begins with 2–3 guard clauses: `if (other === node) return`, `if (!getComponent(other, PlayerTag)) return`, `if (!impactCD.ready) return`. The component-based filtering (`getComponent(other, Tag)`) is the most common guard — checking "is the other entity a player?" before processing. This 3-line preamble is repeated in every collision handler across both the arena and platformer demos (6 usages found).

**Criteria check:**
- Extensible: Filter by component, by layer, by custom predicate
- Better DX: Declarative "only fire for entities with component X"
- Generalized: Component-based collision filtering is universal

### Before

```typescript
// LocalPlayerNode.ts — 3 guard lines before any logic
useOnCollisionStart(({ other }) => {
    if (other === node) return;                     // skip self
    if (!getComponent(other, PlayerTag)) return;    // skip non-players
    if (!impactCD.ready) return;                    // skip during cooldown

    // Actual collision logic starts here...
});

// platformer/CollectibleNode.ts — similar guards
useOnCollisionStart(({ other }) => {
    if (!getComponent(other, PlayerTag)) return;
    // Collect item...
});
```

### After

```typescript
import { useOnCollisionStart } from '@pulse-ts/physics';

// Declarative filtering — handler only fires for PlayerTag entities
useOnCollisionStart(({ other }) => {
    // Directly into collision logic — guards handled by options
}, { filter: PlayerTag, cooldown: IMPACT_COOLDOWN });

// platformer
useOnCollisionStart(({ other }) => {
    // Collect item...
}, { filter: PlayerTag });
```

### API Design

```typescript
interface CollisionHandlerOptions {
    /** Only fire when the other entity has this component. */
    filter?: ComponentType;
    /** Minimum seconds between handler invocations (cooldown guard). */
    cooldown?: number;
    /** Custom predicate — handler fires only when this returns true. */
    when?: (event: CollisionEvent) => boolean;
}

// Enhanced signature (backward-compatible — options are optional):
function useOnCollisionStart(
    handler: (event: CollisionEvent) => void,
    options?: CollisionHandlerOptions,
): void;
```

---

## 41. Procedural Texture Factory (`createTexture`)

**Package:** `@pulse-ts/three` (new utility)

**Problem:** `PlatformNode` contains 5 procedural texture generation functions totaling 150+ lines of boilerplate: `createGridNormalMap()`, `createGridEmissiveMap()`, `createEnergyLineMap()`, `createRingGlowMap()`, `createWakeMap()`. Each independently creates a `Uint8Array`, loops over pixels, encodes RGBA channels, wraps in a `THREE.DataTexture`, and configures wrap/filter modes. `SupernovaNode` similarly generates a procedural texture via Canvas2D with manual blur. The boilerplate (array allocation, DataTexture creation, filter/wrap setup) is identical in every case — only the per-pixel rasterization logic differs.

**Criteria check:**
- Extensible: Any rasterization function, any texture format, configurable wrap/filter
- Better DX: Eliminates 10-15 lines of DataTexture boilerplate per texture
- Generalized: Procedural textures are common in any visually distinctive game

### Before

```typescript
// PlatformNode.ts — createGridNormalMap (30 lines for one texture)
export function createGridNormalMap(size: number = 256, spacing: number = 32): THREE.DataTexture {
    const data = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const i = (y * size + x) * 4;
            let nx = 128, ny = 128;
            const nz = 255;
            if (x % spacing === 0) nx = 96;
            if (y % spacing === 0) ny = 96;
            data[i] = nx;
            data[i + 1] = ny;
            data[i + 2] = nz;
            data[i + 3] = 255;
        }
    }
    const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return tex;
}

// createGridEmissiveMap — another 40 lines with same DataTexture setup
// createEnergyLineMap — another 35 lines with same setup
// createRingGlowMap — another 25 lines with same setup
// createWakeMap — another 15 lines with same setup
```

### After

```typescript
import { createTexture } from '@pulse-ts/three';

const normalMap = createTexture(256, (x, y, size) => {
    const spacing = 32;
    const nx = x % spacing === 0 ? 96 : 128;
    const ny = y % spacing === 0 ? 96 : 128;
    return [nx, ny, 255, 255];
}, { wrap: 'repeat', filter: 'linear' });

const emissiveMap = createTexture(256, (x, y, size) => {
    const spacing = 32;
    const onLine = x % spacing <= 1 || y % spacing <= 1;
    return onLine ? [50, 180, 220, 255] : [0, 0, 0, 255];
}, { wrap: 'repeat', filter: 'linear' });
```

### API Design

```typescript
/** Per-pixel rasterization callback. Returns [R, G, B, A] (0–255). */
type PixelFn = (x: number, y: number, size: number) => [number, number, number, number];

interface TextureOptions {
    wrap?: 'repeat' | 'clamp' | 'mirror';
    filter?: 'linear' | 'nearest';
    format?: 'rgba' | 'rgb';
}

/**
 * Create a procedural DataTexture by rasterizing a per-pixel function.
 * Handles buffer allocation, DataTexture creation, and filter/wrap setup.
 */
function createTexture(size: number, rasterize: PixelFn, options?: TextureOptions): THREE.DataTexture;

/** 1D variant for gradient textures (height = 1). */
function createTexture1D(width: number, rasterize: (x: number, width: number) => [number, number, number, number], options?: TextureOptions): THREE.DataTexture;
```

---

## 42. Trail Buffer Utility (`TrailBuffer<T>`)

**Package:** `@pulse-ts/core` (new data structure utility)

**Problem:** `AtmosphericDustNode` and `PlatformNode` both maintain independent trail buffers with identical lifecycle logic: sample position at an interval → push to array with strength → decay strength each frame → prune dead entries → cap max length. Both implementations are ~30 lines of identical accumulation/decay/splice code. Any game with movement trails, projectile paths, or historical position tracking would duplicate this pattern.

**Criteria check:**
- Extensible: Generic data type, configurable decay and sampling rates
- Better DX: Eliminates duplicated decay + prune + sample logic
- Generalized: Movement trails, wake effects, AI path history, undo buffers

### Before

```typescript
// AtmosphericDustNode.ts — manual trail management
const trail: { x: number; z: number; strength: number }[] = [];
let trailTimer = 0;

// In useFrameUpdate:
trailTimer += dt;
if (trailTimer >= TRAIL_SAMPLE_INTERVAL) {
    trailTimer = 0;
    for (const player of currentPlayers) {
        trail.push({ x: player.x, z: player.z, strength: 1.0 });
        if (trail.length > TRAIL_MAX_LENGTH) trail.shift();
    }
}
for (let i = trail.length - 1; i >= 0; i--) {
    trail[i].strength -= TRAIL_DECAY_RATE * dt;
    if (trail[i].strength <= 0) trail.splice(i, 1);
}
```

```typescript
// PlatformNode.ts — nearly identical trail (different data shape)
const wakeTrail: { x: number; z: number; strength: number; dirX: number; dirZ: number }[] = [];
let wakeTimer = 0;

// Same accumulate → decay → splice pattern
```

### After

```typescript
import { TrailBuffer } from '@pulse-ts/core';

const trail = new TrailBuffer<{ x: number; z: number }>({
    maxLength: 50,
    decayRate: 1.5,      // strength/second
    sampleInterval: 0.05, // seconds between samples
});

// In update loop:
trail.update(dt);
for (const player of currentPlayers) {
    trail.sample({ x: player.x, z: player.z });
}

// Query active entries:
for (const entry of trail.active()) {
    // entry.data.x, entry.data.z, entry.strength (0→1)
}
```

### API Design

```typescript
interface TrailBufferOptions {
    maxLength: number;
    decayRate: number;       // Strength units per second
    sampleInterval?: number; // Min seconds between samples (0 = every call)
}

interface TrailEntry<T> {
    readonly data: T;
    readonly strength: number;  // 1.0 at creation, decays toward 0
    readonly age: number;
}

class TrailBuffer<T> {
    constructor(options: TrailBufferOptions);
    /** Add a sample (respects sampleInterval). */
    sample(data: T): void;
    /** Decay and prune. Call once per frame. */
    update(dt: number): void;
    /** Iterate active entries (strength > 0). */
    active(): Iterable<TrailEntry<T>>;
    /** Number of active entries. */
    readonly length: number;
    /** Remove all entries. */
    clear(): void;
}
```

---

## 43. Throttled Update Hook (`useThrottledUpdate`)

**Package:** `@pulse-ts/core` (new hook)

**Problem:** `PlatformNode` manually implements frame-skipping for expensive operations on mobile: `if (!mobile || ++wakeFrameSkip % 2 === 0)`. `AtmosphericDustNode` halves particle count on mobile. Multiple nodes check `isMobileDevice()` inline and adjust behavior. There's no engine-level pattern for "run this expensive code less frequently" or "skip frames on low-end devices." The frame-skip counter is a closured variable with manual modular arithmetic.

**Criteria check:**
- Extensible: Skip by frame count, by elapsed time, or by performance budget
- Better DX: Declarative "every Nth frame" without manual counters
- Generalized: LOD, deferred updates, physics sub-stepping — all games throttle

### Before

```typescript
// PlatformNode.ts — manual frame-skipping
let wakeFrameSkip = 0;

useFrameUpdate((dt) => {
    const shouldRasterize = !mobile || ++wakeFrameSkip % 2 === 0;
    if (shouldRasterize) {
        // Expensive wake texture rasterization
        rasterizeWakeMap(wakeCtx, wakeData, ...);
        wakeMap.needsUpdate = true;
    }
});

// AtmosphericDustNode.ts — mobile count reduction
const dustCount = mobile ? Math.floor(DUST_COUNT / 2) : DUST_COUNT;
```

### After

```typescript
import { useThrottledUpdate } from '@pulse-ts/core';

// Run every 2nd frame on mobile, every frame on desktop
useThrottledUpdate(mobile ? 2 : 1, (dt) => {
    rasterizeWakeMap(wakeCtx, wakeData, ...);
    wakeMap.needsUpdate = true;
});
```

### API Design

```typescript
/**
 * Register a frame update that runs every Nth frame.
 * Useful for throttling expensive operations on low-end devices.
 *
 * @param skipFrames - Run every Nth frame (1 = every frame, 2 = every other, etc.).
 * @param callback - Same signature as useFrameUpdate.
 * @param options - Optional order and tick kind.
 */
function useThrottledUpdate(
    skipFrames: number,
    callback: (dt: number) => void,
    options?: { order?: number; kind?: 'frame' | 'fixed' },
): void;
```

---

## 44. Conditional Child Mounting (`useConditionalChild`)

**Package:** `@pulse-ts/core` (new hook)

**Problem:** `useChild()` always creates a child node — there's no built-in way to conditionally mount/unmount children based on runtime state. `ArenaNode` uses `if (online)` around `useChild(DisconnectOverlayNode)` and `if (props?.aiPersonality)` around `useChild(IntroOverlayNode)` — these work because the condition is based on immutable props evaluated once at mount time. But there's no way to dynamically spawn/despawn children based on changing game state (e.g., spawn enemy waves, show/hide HUD elements, mount gameplay features conditionally).

**Criteria check:**
- Extensible: Condition can be any reactive expression; supports cleanup on unmount
- Better DX: Declarative "mount this child when condition is true, destroy when false"
- Generalized: Dynamic entity spawning, feature toggles, progressive UI

### Before

```typescript
// ArenaNode.ts — static conditions only (evaluated once at mount)
if (online) {
    useChild(DisconnectOverlayNode, { isHost: props.isHost, onRequestMenu: props.onRequestMenu });
}
if (props?.aiPersonality) {
    useChild(IntroOverlayNode, { personality: props.aiPersonality });
}

// Dynamic mounting? Must manually track node reference + destroy/recreate:
let enemyNode: Node | null = null;

useFrameUpdate(() => {
    if (shouldSpawnEnemy && !enemyNode) {
        enemyNode = world.mount(EnemyNode, props, { parent: node });
    } else if (!shouldSpawnEnemy && enemyNode) {
        enemyNode.destroy();
        enemyNode = null;
    }
});
```

### After

```typescript
import { useConditionalChild } from '@pulse-ts/core';

// Mounts when condition becomes true, destroys when false
useConditionalChild(
    () => online,
    DisconnectOverlayNode,
    { isHost: props.isHost, onRequestMenu: props.onRequestMenu },
);

// Dynamic enemy spawning — reactive to game state
useConditionalChild(
    () => gameState.phase === 'playing' && waveActive,
    EnemyNode,
    { difficulty: currentWave },
);
```

### API Design

```typescript
/**
 * Conditionally mount/unmount a child node based on a reactive guard.
 * The guard is evaluated each fixed tick. When it transitions:
 *   false → true: child is mounted
 *   true → false: child is destroyed
 *
 * @param guard - Evaluated each tick to determine mount state.
 * @param fc - The function component to mount.
 * @param props - Props passed to the FC.
 */
function useConditionalChild<P>(
    guard: () => boolean,
    fc: FC<P>,
    props?: P,
): void;
```

---

## 45. Spatial Influence System (`useInfluenceField`)

**Package:** `@pulse-ts/core` or `@pulse-ts/effects` (new utility)

**Problem:** `AtmosphericDustNode` and `PlatformNode` both implement the same "spatial influence accumulation" pattern: iterate a list of positions with strength/radius → for each particle/pixel, sum distance-weighted forces → clamp result. AtmosphericDustNode does this for 1500 particles × N influence zones per frame. PlatformNode does it for wake texture rasterization. The pattern (accumulate forces with distance-based falloff, then clamp) is duplicated with different data shapes but identical math.

**Criteria check:**
- Extensible: Custom falloff curves, arbitrary zone data, configurable clamping
- Better DX: Shared influence accumulation logic instead of inline nested loops
- Generalized: Particle fields, terrain deformation, AI threat maps, audio occlusion

### Before

```typescript
// AtmosphericDustNode.ts — influence accumulation per particle
let targetDx = 0, targetDz = 0;

for (const inf of influences) {
    const dx = cx - inf.x;
    const dz = cz - inf.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const radius = inf.radius ?? DUST_INFLUENCE_RADIUS;
    if (dist < radius && dist > 0.01) {
        const t = 1 - dist / radius;                    // linear falloff
        const strength = t * t * inf.strength;           // squared for smoothstep-like
        const pushStr = inf.pushStrength ?? DUST_PUSH_STRENGTH;
        const nx = dx / dist;
        const nz = dz / dist;
        targetDx += nx * strength * pushStr;
        targetDz += nz * strength * pushStr;
    }
}

// Clamp total displacement
const mag = Math.sqrt(targetDx * targetDx + targetDz * targetDz);
if (mag > MAX_DISPLACEMENT) {
    targetDx *= MAX_DISPLACEMENT / mag;
    targetDz *= MAX_DISPLACEMENT / mag;
}
```

### After

```typescript
import { InfluenceField } from '@pulse-ts/core';

const field = new InfluenceField({
    falloff: 'quadratic',        // t² falloff
    maxMagnitude: MAX_DISPLACEMENT,
});

// Add zones
field.clear();
for (const player of players) {
    field.addZone(player.x, player.z, { radius: DUST_INFLUENCE_RADIUS, strength: 1.0 });
}

// Query per particle
const [dx, dz] = field.sample(particleX, particleZ);
```

### API Design

```typescript
interface InfluenceZone {
    x: number;
    z: number;
    radius: number;
    strength: number;
    pushStrength?: number;
}

interface InfluenceFieldOptions {
    falloff?: 'linear' | 'quadratic' | 'smoothstep' | ((t: number) => number);
    maxMagnitude?: number;
}

class InfluenceField {
    constructor(options?: InfluenceFieldOptions);
    addZone(x: number, z: number, zone: Partial<InfluenceZone>): void;
    clear(): void;
    /** Compute accumulated displacement at a point. Returns [dx, dz]. */
    sample(x: number, z: number): [number, number];
}
```

---

## 46. Animation Property Binding (`useAnimationBinding`)

**Package:** `@pulse-ts/effects` (new utility)

**Problem:** Every node that uses `useAnimate` must manually read `.value` each frame and assign it to a property: `ringMaterial.emissiveIntensity = pulse.value`, `energyMesh.rotation.y = spin.value`, `glowMap.offset.x = -scrollSpin.value`. PlatformNode alone has 5 such bindings in its `useFrameUpdate`. The pattern is always: create animation → read value → assign to target. This is 2 lines of glue code per binding (the `useAnimate` call and the assignment), but for nodes with many animated properties it adds up.

**Criteria check:**
- Extensible: Any target property, optional transform function, multiple bindings
- Better DX: Declarative "drive this property with this animation"
- Generalized: Material animation, transform animation, UI value animation

### Before

```typescript
// PlatformNode.ts — manual animation → property binding
const pulse = useAnimate({ wave: 'sine', min: 0.4, max: 1.5, frequency: 1.5 });
const energySpin = useAnimate({ rate: 0.3 });
const ringGlowSpin = useAnimate({ rate: RING_GLOW_SPEED });

useFrameUpdate(() => {
    ringMaterial.emissiveIntensity = pulse.value;
    glowMaterial.emissiveIntensity = pulse.value * 0.4;
    energyMesh.rotation.y = energySpin.value;
    const glowOffset = -ringGlowSpin.value;
    ringGlowMap.offset.x = glowOffset;
    glowGlowMap.offset.x = glowOffset;
});
```

### After

```typescript
import { useAnimationBinding } from '@pulse-ts/effects';

useAnimationBinding({ wave: 'sine', min: 0.4, max: 1.5, frequency: 1.5 }, [
    [ringMaterial, 'emissiveIntensity'],
    [glowMaterial, 'emissiveIntensity', (v) => v * 0.4],
]);

useAnimationBinding({ rate: 0.3 }, [
    [energyMesh.rotation, 'y'],
]);

useAnimationBinding({ rate: RING_GLOW_SPEED }, [
    [ringGlowMap.offset, 'x', (v) => -v],
    [glowGlowMap.offset, 'x', (v) => -v],
]);
```

### API Design

```typescript
type PropertyBinding = [
    target: Record<string, any>,
    property: string,
    transform?: (value: number) => number,
];

/**
 * Create an animation and automatically bind its value to one or more properties.
 * Updates happen in useFrameUpdate; no manual wiring needed.
 */
function useAnimationBinding(
    animation: AnimateOptions,
    bindings: PropertyBinding[],
): AnimatedValue;
```

---

## 47. Noise Function Utilities (`noise2D`, `noise3D`)

**Package:** `@pulse-ts/core` (new math utility)

**Problem:** `AtmosphericDustNode` imports and uses a `noise2D` function for curl noise drift — 4 calls per particle per frame. The noise function is defined locally in the arena demo with no engine-level equivalent. Perlin/simplex noise is fundamental to procedural generation: terrain, particles, shader effects, AI wander patterns, camera shake. Any game that needs organic-looking variation will need noise functions.

**Criteria check:**
- Extensible: 2D, 3D, 4D variants; configurable octaves/persistence for fBm
- Better DX: Import from engine instead of vendoring or reimplementing
- Generalized: Terrain, particles, shaders, AI, camera — noise is everywhere

### Before

```typescript
// AtmosphericDustNode.ts — local noise function import
import { noise2D } from '../noise';

// Usage: curl noise drift
const curlX = (noise2D(sx, sz + e) - noise2D(sx, sz - e)) / (2 * e);
const curlZ = -(noise2D(sx + e, sz) - noise2D(sx - e, sz)) / (2 * e);
```

### After

```typescript
import { noise2D, curlNoise2D } from '@pulse-ts/core';

// Direct use
const n = noise2D(x, y);

// Curl noise helper — returns divergence-free 2D vector
const [curlX, curlZ] = curlNoise2D(x, z, { epsilon: 0.5, scale: 0.3 });
```

### API Design

```typescript
/** Simplex noise returning value in [-1, 1]. */
function noise2D(x: number, y: number): number;
function noise3D(x: number, y: number, z: number): number;

/** Fractional Brownian motion (layered noise). */
function fbm2D(x: number, y: number, options?: { octaves?: number; persistence?: number; lacunarity?: number }): number;

/** Curl noise — divergence-free 2D vector field derived from scalar noise. */
function curlNoise2D(x: number, z: number, options?: { epsilon?: number; scale?: number }): [number, number];
```

---

## 48. World Lifecycle Events (`onWorldCreate`, `onWorldDestroy`)

**Package:** `@pulse-ts/core` (enhancement to World)

**Problem:** The World class emits `onNodeAdded` and `onNodeRemoved` events but has no lifecycle events for world creation or destruction. `GameManagerNode` must manually reset 7 module singletons because there's no "world is starting" event to hook into. `main.ts` tracks world references in closures to know when to tear down and recreate. The save package needs to know when a world is being serialized. Any system that needs to react to world-level lifecycle changes (analytics, debug tools, performance monitoring) must poll or use ad-hoc patterns.

**Criteria check:**
- Extensible: Multiple listeners per event; typed event payloads
- Better DX: Declarative "do X when world starts/stops"
- Generalized: Save/load, analytics, debug tools, resource management

### Before

```typescript
// main.ts — manual world lifecycle tracking
let currentWorld: World | null = null;

async function startGame() {
    if (currentWorld) {
        currentWorld.destroy();  // No event emitted
        currentWorld = null;
    }
    currentWorld = createWorld();
    // Must manually notify all systems that world changed
}

// GameManagerNode.ts — must manually reset at the right time
export function GameManagerNode() {
    clearRecording();
    endReplay();
    resetDashCooldownProgress();
    resetHitImpacts();
    // ...7 manual calls
}
```

### After

```typescript
import { onWorldCreate, onWorldDestroy } from '@pulse-ts/core';

// Module-level registration — runs whenever ANY world is created
onWorldCreate((world) => {
    resetDashCooldownProgress();
    resetHitImpacts();
    // etc.
});

onWorldDestroy((world) => {
    // Cleanup external resources, flush analytics, etc.
});
```

### API Design

```typescript
type WorldLifecycleHandler = (world: World) => void;

/** Register a callback that fires when any World is created. */
function onWorldCreate(handler: WorldLifecycleHandler): () => void;

/** Register a callback that fires when any World is destroyed. */
function onWorldDestroy(handler: WorldLifecycleHandler): () => void;

/** Register a callback that fires when a World is paused/resumed. */
function onWorldPause(handler: (world: World, paused: boolean) => void): () => void;
```

---

## 49. Scene Traversal Query Hook (`useSceneQuery`)

**Package:** `@pulse-ts/three` (new hook)

**Problem:** `PlatformNode` and `AtmosphericDustNode` both manually traverse the Three.js scene to find player positions: `scene.traverse((child) => { if (child.type === 'Group' && child.parent !== scene) { ... } })`. This pattern-matching traversal is fragile (relies on `child.type` and parent hierarchy), duplicated across 2+ nodes, and must account for the nested Group structure documented in `.claude/rules/arena/scene-graph-structure.md`. Any node that needs to react to other 3D objects' positions must rewrite this traversal.

**Criteria check:**
- Extensible: Filter by type, by tag, by component; cached results
- Better DX: Declarative scene query instead of manual traversal
- Generalized: AI target finding, proximity effects, LOD systems, collision avoidance

### Before

```typescript
// PlatformNode.ts — manual scene traversal to find players
const currentPlayers: { x: number; z: number }[] = [];
scene.traverse((child) => {
    if (child.type === 'Group' && child.parent !== scene) {
        const p = child.position;
        const xzDistSq = p.x * p.x + p.z * p.z;
        if (xzDistSq < ARENA_RADIUS * ARENA_RADIUS * 4) {
            currentPlayers.push({ x: p.x, z: p.z });
        }
    }
});

// AtmosphericDustNode.ts — same traversal, different data extraction
scene.traverse((node) => {
    if (node instanceof THREE.Group && node.position.y > 0.5) {
        influences.push({ x: node.position.x, z: node.position.z, strength: 1 });
    }
});
```

### After

```typescript
import { useSceneQuery } from '@pulse-ts/three';

// Declarative: find all groups that look like players
const players = useSceneQuery({
    type: 'Group',
    filter: (obj) => obj.parent !== scene && obj.position.y > 0.5,
});

// In update:
for (const player of players.results()) {
    // player.position.x, player.position.z — always fresh
}
```

### API Design

```typescript
interface SceneQueryOptions {
    /** Filter by Three.js object type. */
    type?: string;
    /** Custom predicate filter. */
    filter?: (obj: THREE.Object3D) => boolean;
    /** Update frequency. Default: 'frame' (every frame). */
    updateFrequency?: 'frame' | 'fixed' | 'manual';
}

interface SceneQueryHandle {
    /** Get current matching results. */
    results(): THREE.Object3D[];
    /** Number of matches. */
    readonly count: number;
    /** Force a re-query (for 'manual' mode). */
    refresh(): void;
}

function useSceneQuery(options: SceneQueryOptions): SceneQueryHandle;
```

---

## 50. Sound Effect Registry (`defineSoundEffect` / `useSoundEffect`)

**Package:** `@pulse-ts/audio` (new pattern)

**Problem:** Sound effects are scattered across individual nodes as inline `useSound` calls with hardcoded parameters. `LocalPlayerNode` defines 3 sounds, `GameManagerNode` defines 4 sounds, `MatchOverOverlayNode` defines 1 sound — all with magic-number frequencies, gains, and durations. There's no centralized sound catalog, no way to tweak all sounds from one location, and no reuse across nodes (the impact sound in `LocalPlayerNode` and `ReplayNode` is defined twice with identical parameters).

**Criteria check:**
- Extensible: Add/override sounds per game mode; supports presets
- Better DX: Define all sounds once; use by name everywhere
- Generalized: Every game with audio needs a centralized sound catalog

### Before

```typescript
// LocalPlayerNode.ts — inline sound definition
const dashSfx = useSound('noise', {
    filter: 'bandpass', frequency: [2000, 500], duration: 0.15, gain: 0.12,
});
const impactSfx = useSound('tone', {
    wave: 'square', frequency: [300, 100], duration: 0.1, gain: 0.15,
});

// GameManagerNode.ts — more inline definitions
const beepSfx = useSound('tone', {
    wave: 'sine', frequency: [880, 880], duration: 0.1, gain: 0.1,
});
const goSfx = useSound('tone', {
    wave: 'sine', frequency: [1046.5, 1046.5], duration: 0.3, gain: 0.15,
});

// ReplayNode.ts — DUPLICATE of impact sound
const impactSfx = useSound('tone', {
    wave: 'square', frequency: [300, 100], duration: 0.1, gain: 0.15,
});
```

### After

```typescript
// config/sounds.ts — centralized catalog
import { defineSoundEffect } from '@pulse-ts/audio';

export const Sounds = {
    dash: defineSoundEffect('noise', { filter: 'bandpass', frequency: [2000, 500], duration: 0.15, gain: 0.12 }),
    impact: defineSoundEffect('tone', { wave: 'square', frequency: [300, 100], duration: 0.1, gain: 0.15 }),
    beep: defineSoundEffect('tone', { wave: 'sine', frequency: [880, 880], duration: 0.1, gain: 0.1 }),
    go: defineSoundEffect('tone', { wave: 'sine', frequency: [1046.5, 1046.5], duration: 0.3, gain: 0.15 }),
    fanfare: defineSoundEffect('arpeggio', { wave: 'sine', notes: [523, 659, 784, 1047], interval: 0.08, duration: 0.4, gain: 0.12 }),
};

// LocalPlayerNode.ts — use by reference
const dashSfx = useSoundEffect(Sounds.dash);
const impactSfx = useSoundEffect(Sounds.impact);

// ReplayNode.ts — same sound, no duplication
const impactSfx = useSoundEffect(Sounds.impact);
```

### API Design

```typescript
interface SoundEffectDef<T extends SoundType> {
    readonly type: T;
    readonly options: SoundOptionsFor<T>;
}

/** Define a reusable sound effect configuration. */
function defineSoundEffect<T extends SoundType>(type: T, options: SoundOptionsFor<T>): SoundEffectDef<T>;

/** Create a sound handle from a predefined effect. */
function useSoundEffect<T extends SoundType>(def: SoundEffectDef<T>): SoundHandle;
```

---

## Updated Summary

| # | Improvement | Package | Impact | Arena nodes affected |
|---|-----------|---------|--------|---------------------|
| 1 | `useOverlay` | `@pulse-ts/three` | Eliminates DOM boilerplate | 12+ nodes |
| 2 | `useWhen` | `@pulse-ts/core` | Reactive visibility/transition tracking | 10+ nodes |
| 3 | `buildWorld` | `@pulse-ts/core` | Eliminates bootstrap duplication | main.ts (3 functions) |
| 4 | `defineStore`/`useStore` | `@pulse-ts/core` | World-scoped shared state | 5 singleton modules + GameManagerNode |
| 5 | `useWatch` | `@pulse-ts/core` | Declarative value-change detection | 6+ nodes |
| 6 | `useButton` | `@pulse-ts/three` | Eliminates button factory duplication | 3 overlay nodes |
| 7 | `useScreenProjection` | `@pulse-ts/three` | Simplifies 3D→screen coordinate mapping | Any node with DOM-over-3D |
| 8 | `useTrailEmitter` | `@pulse-ts/effects` | Velocity-proportional trail emission | 3 player/replay nodes |
| 9 | Lifecycle-aware channels | `@pulse-ts/network` | Prevents lost messages on world destroy | 2+ networked nodes |
| 10 | `useStateMachine` | `@pulse-ts/core` | Declarative state machines | GameManagerNode, AI, menus |
| 11 | `useCameraShake` | `@pulse-ts/three` | Reusable camera shake with decay | CameraRigNode + any trigger site |
| 12 | `useSequence` | `@pulse-ts/effects` | Declarative time-sequenced actions | IntroOverlayNode, ReplayNode |
| 13 | `useTween` | `@pulse-ts/effects` | JS-driven value interpolation | ScoreHudNode, overlays |
| 14 | Mobile utilities | `@pulse-ts/platform` | Fullscreen, orientation, install prompt | main.ts + mobile nodes |
| 15 | `useVirtualJoystick` | `@pulse-ts/input` | Touch joystick with input injection | TouchControlsNode |
| 16 | `useEffectPool` | `@pulse-ts/effects` | Fixed-size timed slot pool | shockwave, hitImpact, supernova |
| 17 | `useShaderMaterial` | `@pulse-ts/three` | Type-safe shader patching | PlatformNode, StarfieldNode, NebulaNode |
| 18 | `useLightingRig` | `@pulse-ts/three` | One-liner lighting environment setup | ArenaNode, MenuSceneNode |
| 19 | Math utilities | `@pulse-ts/core` | `lerp`, `damp`, `smoothstep`, `clamp`, `remap` | 10+ nodes with interpolation |
| 20 | `usePostProcessing` | `@pulse-ts/three` | Declarative post-processing pipeline | setupPostProcessing.ts |
| 21 | `defineTheme` | `@pulse-ts/core` | Centralized visual constants w/ format derivation | 7+ files with scattered colors |
| 22 | `usePhaseUpdate` | `@pulse-ts/core` | Phase-gated update callbacks | 15+ phase guards across 8 nodes |
| 23 | `useCollisionResponse` | `@pulse-ts/physics` | Declarative collision knockback + effects | LocalPlayerNode (110-line handler) |
| 24 | `useModal` | `@pulse-ts/three` | Backdrop + content + fade + entrance | 3 overlay nodes (120+ shared lines) |
| 25 | `useInterpolatedPosition` | `@pulse-ts/three` | Fixed→frame position interpolation | LocalPlayerNode, AiPlayerNode |
| 26 | `definePrefab` | `@pulse-ts/core` | FC with baked default props | ArenaNode's 3-branch spawning |
| 27 | `useModuleReset` | `@pulse-ts/core` | Self-registering module cleanup | GameManagerNode's 7 manual resets |
| 28 | `useEntrance` | `@pulse-ts/three` | Declarative visibility-triggered animations | 5 overlay nodes |
| 29 | `useRemoteEntity` | `@pulse-ts/network` | One-liner network entity setup | RemotePlayerNode, LocalPlayerNode |
| 30 | `useWatch` (round reset) | `@pulse-ts/core` | Validates #5 — most common use case | LocalPlayerNode, RemotePlayerNode |
| 31 | `useScreen` / `useScreenFlow` | `@pulse-ts/core` | Promise-based screen flow orchestration | menu.ts (218 lines), lobby.ts (845 lines) |
| 32 | `RingBuffer<T>` | `@pulse-ts/core` | Generic ring buffer w/ snapshot + interpolated query | replay.ts (500 lines) |
| 33 | `useMesh` material extensions | `@pulse-ts/three` | Texture maps, material types, render state | PlatformNode (40+ manual lines) |
| 34 | Timer completion callbacks | `@pulse-ts/core` | `onComplete`/`onTick` for useTimer/useCooldown | GameManagerNode (4 polling blocks) |
| 35 | `defineComponent` / `defineTag` | `@pulse-ts/core` | One-liner markers, typed data components | PlayerTag + any custom component |
| 36 | `useSoundGroup` | `@pulse-ts/audio` | Independent volume control per sound category | 7+ sounds across 3 files |
| 37 | `Axis2D.keys()` shorthand | `@pulse-ts/input` | 1-line WASD/arrow binding | config/bindings.ts |
| 38 | `useCustomMesh` | `@pulse-ts/three` | Custom geometry + material with lifecycle | StarfieldNode, NebulaNode, EnergyPillarsNode |
| 39 | `useSyncedTimer` | `@pulse-ts/network` | RTT-compensated synchronized timer | GameManagerNode (30-line handshake) |
| 40 | Collision filter options | `@pulse-ts/physics` | Declarative component filter + cooldown on collision hooks | 6 collision handlers across 2 demos |
| 41 | `createTexture` | `@pulse-ts/three` | Procedural texture factory with pixel callback | PlatformNode (5 texture functions) |
| 42 | `TrailBuffer<T>` | `@pulse-ts/core` | Generic trail buffer with decay/prune lifecycle | AtmosphericDustNode, PlatformNode (duplicated) |
| 43 | `useThrottledUpdate` | `@pulse-ts/core` | Frame-skipping for expensive per-frame operations | AtmosphericDustNode (mobile perf), particle systems |
| 44 | `useConditionalChild` | `@pulse-ts/core` | Reactive child mount/unmount based on state | ArenaNode (3-branch spawning), GameManagerNode |
| 45 | `useInfluenceField` | `@pulse-ts/core` | Spatial influence accumulation with distance falloff | AtmosphericDustNode (3 influence types) |
| 46 | `useAnimationBinding` | `@pulse-ts/effects` | Declarative property-to-animation bindings | ScoreHudNode, overlays, ReplayNode |
| 47 | Noise utilities | `@pulse-ts/core` | `noise2D`, `noise3D`, `curlNoise2D` | AtmosphericDustNode, StarfieldNode, NebulaNode |
| 48 | World lifecycle events | `@pulse-ts/core` | `onWorldCreate`/`onWorldDestroy` callbacks | GameManagerNode (7 manual resets) |
| 49 | `useSceneQuery` | `@pulse-ts/three` | Scene graph traversal query hook | Any node needing to find objects by predicate |
| 50 | `defineSoundEffect` / `useSoundEffect` | `@pulse-ts/audio` | Centralized sound catalog with reuse by reference | 7+ sounds across 3 files (2 duplicates) |

### Priority recommendation

**High impact, low complexity:** 1 (`useOverlay`), 5 (`useWatch`), 4 (`useStore`), 19 (math utils), 22 (`usePhaseUpdate`), 25 (`useInterpolatedPosition`), 34 (timer callbacks), 35 (`defineComponent`), 37 (input shorthand), 40 (collision filters), 47 (noise utilities), 50 (`defineSoundEffect`)
**High impact, medium complexity:** 3 (`buildWorld`), 10 (`useStateMachine`), 2 (`useWhen`), 16 (`useEffectPool`), 21 (`defineTheme`), 27 (`useModuleReset`), 31 (`useScreen`), 33 (`useMesh` extensions), 41 (`createTexture`), 44 (`useConditionalChild`), 48 (world lifecycle events)
**Medium impact, medium complexity:** 11 (`useCameraShake`), 13 (`useTween`), 15 (`useVirtualJoystick`), 17 (`useShaderMaterial`), 20 (`usePostProcessing`), 23 (`useCollisionResponse`), 24 (`useModal`), 32 (`RingBuffer`), 36 (`useSoundGroup`), 38 (`useCustomMesh`), 39 (`useSyncedTimer`), 42 (`TrailBuffer`), 45 (`useInfluenceField`), 46 (`useAnimationBinding`)
**Medium impact, low complexity:** 6 (`useButton`), 7 (`useScreenProjection`), 8 (`useTrailEmitter`), 9 (network flush), 12 (`useSequence`), 14 (mobile utils), 18 (`useLightingRig`), 26 (`definePrefab`), 28 (`useEntrance`), 29 (`useRemoteEntity`), 43 (`useThrottledUpdate`), 49 (`useSceneQuery`)
