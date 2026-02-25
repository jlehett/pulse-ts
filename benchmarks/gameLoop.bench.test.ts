/**
 * Cross-package integration benchmarks — full game-loop simulation.
 *
 * Each bench iteration mirrors what the engine does every frame:
 *
 *   1. **ECS query** — `defineQuery([Transform, RigidBody]).run(world)` to
 *      collect all physics-driven entities.
 *   2. **Physics step** — `PhysicsService.step(dt)` runs broad-phase, narrow-phase,
 *      constraint solving, and integration. This also marks affected Transforms dirty.
 *   3. **World TRS read** — `getWorldTRS()` on every body Transform, simulating a
 *      render system consuming up-to-date world matrices. All reads are cache-misses
 *      because physics dirtied them in step 2.
 *
 * This end-to-end cost is invisible in per-package microbenchmarks:
 * - `transform.bench.test.ts` measures Transform in isolation (no physics)
 * - `physicsStep.bench.test.ts` measures physics in isolation (no TRS reads)
 * Here we measure the compounded cost that actually runs in a game frame.
 *
 * Scene setup: N dynamic sphere bodies arranged in a 10-column grid above a
 * static ground plane. Bodies accumulate velocity/position across iterations,
 * giving a realistic mix of airborne and settled-body costs.
 *
 * **Note on 250 and 500 body scenes:** these are intentionally demanding.
 * Expect hz in the single or low-double digits. They exist to surface O(n²)
 * scaling in the broad-phase or constraint solver — if those scale linearly
 * after optimization, these counts will confirm it.
 *
 * Run with: npm run bench -w benchmarks
 * Run all:  npm run bench
 */
import { describe, bench } from 'vitest';
import {
    World,
    Node,
    attachComponent,
    Transform,
    defineQuery,
} from '@pulse-ts/core';
import { installPhysics, RigidBody, Collider } from '@pulse-ts/physics';

const DT = 1 / 60;

/**
 * Query shared across all scenes. Because the component index is global,
 * `run(world)` filters candidates to the given world's node set, so each
 * scene's bench iteration only touches its own entities.
 */
const BODY_QUERY = defineQuery([Transform, RigidBody]);

/** A fully-wired scene returned by {@link makeScene}. */
interface Scene {
    world: World;
    physics: ReturnType<typeof installPhysics>;
    /** Cached array of body Transforms for the world-TRS read step. */
    bodyTransforms: Transform[];
}

/**
 * Builds a scene with `bodyCount` dynamic sphere bodies above a static ground
 * plane. Returns the world, the PhysicsService, and a pre-built array of body
 * Transforms so the render-read step doesn't need to re-query each iteration.
 *
 * @param bodyCount - Number of dynamic sphere bodies to create.
 */
function makeScene(bodyCount: number): Scene {
    const world = new World();
    const physics = installPhysics(world, {
        gravity: { x: 0, y: -9.81, z: 0 },
    });

    // Static ground plane at y = 0.
    const groundNode = world.add(new Node());
    attachComponent(groundNode, Transform);
    const groundCol = attachComponent(groundNode, Collider);
    groundCol.kind = 'plane';
    groundCol.planeNormal.set(0, 1, 0);

    // Dynamic sphere bodies arranged in a 10-column grid above the ground.
    const bodyTransforms: Transform[] = [];
    for (let i = 0; i < bodyCount; i++) {
        const node = world.add(new Node());
        const t = attachComponent(node, Transform);
        t.setLocal({
            position: {
                x: (i % 10) * 1.5,
                y: 2 + Math.floor(i / 10) * 2,
                z: 0,
            },
        });

        const rb = attachComponent(node, RigidBody);
        rb.mass = 1;

        const col = attachComponent(node, Collider);
        col.kind = 'sphere';
        col.radius = 0.4;

        bodyTransforms.push(t);
    }

    return { world, physics, bodyTransforms };
}

// Scenes are built once at module load. Bench iterations run on the same
// scene state across calls, giving a realistic steady-state cost profile.
const scene50 = makeScene(50);
const scene100 = makeScene(100);
const scene250 = makeScene(250);
const scene500 = makeScene(500);

describe('Game loop — ECS query + physics step + world TRS read', () => {
    bench('50 bodies', () => {
        // Step 1: ECS query — collect physics-driven entities.
        for (const _ of BODY_QUERY.run(scene50.world)) { /* iterate */ }
        // Step 2: Physics step — integrates velocities, resolves collisions,
        //         and marks dirty Transforms for any body that moved.
        scene50.physics.step(DT);
        // Step 3: World TRS read — all bodies were dirtied by physics;
        //         every call is a cache-miss recompute.
        for (const t of scene50.bodyTransforms) {
            t.getWorldTRS(undefined, 0);
        }
    });

    bench('100 bodies', () => {
        for (const _ of BODY_QUERY.run(scene100.world)) { /* iterate */ }
        scene100.physics.step(DT);
        for (const t of scene100.bodyTransforms) {
            t.getWorldTRS(undefined, 0);
        }
    });

    bench('250 bodies', () => {
        for (const _ of BODY_QUERY.run(scene250.world)) { /* iterate */ }
        scene250.physics.step(DT);
        for (const t of scene250.bodyTransforms) {
            t.getWorldTRS(undefined, 0);
        }
    });

    bench('500 bodies', () => {
        for (const _ of BODY_QUERY.run(scene500.world)) { /* iterate */ }
        scene500.physics.step(DT);
        for (const t of scene500.bodyTransforms) {
            t.getWorldTRS(undefined, 0);
        }
    });
});
