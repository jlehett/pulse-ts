/**
 * Physics step microbenchmarks.
 *
 * Measures the end-to-end cost of `PhysicsService.step(dt)` — which includes:
 *   1. Velocity integration (forces, impulses, gravity, damping)
 *   2. Transform integration (positions + rotations)
 *   3. Broad-phase collision detection (spatial grid)
 *   4. Narrow-phase collision detection (manifold computation)
 *   5. Positional correction and iterative constraint solving
 *   6. Collision start/end event dispatch
 *
 * Scenes contain N dynamic sphere bodies above a static ground plane to
 * produce realistic collision work. Bodies are arranged in a 10-wide grid so
 * the broad-phase has non-trivial spatial distribution to work with.
 *
 * Run with: npm run bench -w packages/physics
 *
 * NOTE: @pulse-ts/core is resolved from source via the vitest.config.ts alias,
 * so no prior build step is required.
 */
import { describe, bench } from 'vitest';
import { World, Node, attachComponent, Transform } from '@pulse-ts/core';
import { installPhysics } from '../../public/install';
import { RigidBody } from '../../public/components/RigidBody';
import { Collider } from '../../public/components/Collider';

const DT = 1 / 60;

/**
 * Builds a scene with `bodyCount` dynamic sphere bodies above a static ground
 * plane. Physics is installed on the world so components auto-register.
 *
 * Returns the PhysicsService for direct `step()` calls — the world's system
 * loop is never started, so only the manual step call runs.
 */
function makeScene(bodyCount: number) {
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
    }

    return physics;
}

// Build scenes once at module load; each bench iteration calls step() on
// the same scene (bodies accumulate velocity/position across iterations,
// which gives a realistic mix of airborne and settled-body costs).
const physics10 = makeScene(10);
const physics50 = makeScene(50);
const physics100 = makeScene(100);

describe('Physics step — dynamic sphere bodies + ground plane', () => {
    bench('step — 10 bodies', () => {
        physics10.step(DT);
    });

    bench('step — 50 bodies', () => {
        physics50.step(DT);
    });

    bench('step — 100 bodies', () => {
        physics100.step(DT);
    });
});
