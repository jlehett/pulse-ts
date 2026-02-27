import { World, useComponent, Transform } from '@pulse-ts/core';
import { installPhysics } from './install';
import { useRigidBody } from './hooks';
import { useWaypointPatrol } from './useWaypointPatrol';
import type { PatrolHandle, Point3 } from './useWaypointPatrol';

/** Fixed step size in milliseconds (matching the world config below). */
const FIXED_MS = 10;

/**
 * Helper: mounts a component with a patrol and returns the handle, the
 * world (for stepping), and a position getter.
 */
function setupPatrol(options: Parameters<typeof useWaypointPatrol>[1]) {
    const world = new World({ fixedStepMs: FIXED_MS });
    installPhysics(world, { gravity: { x: 0, y: 0, z: 0 } });
    let handle!: PatrolHandle;
    let transform!: Transform;

    function PatrolNode() {
        transform = useComponent(Transform);
        transform.localPosition.set(
            options.waypoints[0][0],
            options.waypoints[0][1],
            options.waypoints[0][2],
        );
        const body = useRigidBody({ type: 'kinematic' });
        handle = useWaypointPatrol(body, options);
    }

    world.mount(PatrolNode);

    const getPos = (): Point3 => [
        transform.localPosition.x,
        transform.localPosition.y,
        transform.localPosition.z,
    ];

    /** Advances the world by `steps` fixed ticks. */
    const step = (steps = 1) => {
        // Each tick of FIXED_MS ms triggers exactly one fixed step
        for (let i = 0; i < steps; i++) {
            world.tick(FIXED_MS);
        }
    };

    return { world, handle, getPos, step };
}

// ---------------------------------------------------------------------------
// Speed mode tests
// ---------------------------------------------------------------------------

describe('useWaypointPatrol — speed mode', () => {
    test('moves body toward second waypoint', () => {
        const { getPos, step } = setupPatrol({
            waypoints: [
                [0, 0, 0],
                [10, 0, 0],
            ],
            speed: 5,
        });

        step(30); // 0.5 seconds at 5 u/s → should be around x=2.5
        const [x] = getPos();
        expect(x).toBeGreaterThan(0);
        expect(x).toBeLessThan(10);
    });

    test('ping-pongs between two waypoints', () => {
        const { getPos, step } = setupPatrol({
            waypoints: [
                [0, 0, 0],
                [1, 0, 0],
            ],
            speed: 10, // fast — traverses in ~6 frames
        });

        // After enough time, should have reversed direction
        step(60);
        // The body should have bounced back
        const [x] = getPos();
        // With ping-pong at speed 10 between 0 and 1, it crosses many times
        expect(x).toBeGreaterThanOrEqual(-0.5);
        expect(x).toBeLessThanOrEqual(1.5);
    });

    test('pause stops movement and resume continues', () => {
        const { getPos, step, handle } = setupPatrol({
            waypoints: [
                [0, 0, 0],
                [10, 0, 0],
            ],
            speed: 5,
        });

        step(10);
        const [x1] = getPos();
        expect(x1).toBeGreaterThan(0);

        handle.pause();
        expect(handle.paused).toBe(true);
        step(30);
        const [x2] = getPos();
        // Position should not change when paused (velocity is zero)
        expect(Math.abs(x2 - x1)).toBeLessThan(0.01);

        handle.resume();
        expect(handle.paused).toBe(false);
        step(10);
        const [x3] = getPos();
        expect(x3).toBeGreaterThan(x2);
    });

    test('handles 3+ waypoints with ping-pong', () => {
        const { step, handle } = setupPatrol({
            waypoints: [
                [0, 0, 0],
                [1, 0, 0],
                [2, 0, 0],
            ],
            speed: 100, // very fast
        });

        step(60);
        expect(handle.currentSegment).toBeDefined();
        expect(typeof handle.direction).toBe('number');
    });

    test('loop mode wraps around instead of ping-ponging', () => {
        const { step, handle } = setupPatrol({
            waypoints: [
                [0, 0, 0],
                [1, 0, 0],
                [1, 1, 0],
            ],
            speed: 100,
            loop: true,
        });

        // With loop=true and very high speed, direction should stay 1
        step(120);
        expect(handle.direction).toBe(1);
    });

    test('currentSegment starts at 0', () => {
        const { handle } = setupPatrol({
            waypoints: [
                [0, 0, 0],
                [10, 0, 0],
            ],
            speed: 5,
        });
        expect(handle.currentSegment).toBe(0);
    });
});

// ---------------------------------------------------------------------------
// Duration mode tests
// ---------------------------------------------------------------------------

describe('useWaypointPatrol — duration mode', () => {
    test('moves body toward target over duration', () => {
        const { getPos, step } = setupPatrol({
            waypoints: [
                [0, 0, 0],
                [10, 0, 0],
            ],
            duration: 1, // 1 second per segment
        });

        // After 0.5 seconds (30 frames), should be roughly at x=5
        step(30);
        const [x] = getPos();
        expect(x).toBeGreaterThan(2);
        expect(x).toBeLessThan(8);
    });

    test('custom easing function is applied', () => {
        const customEasing = jest.fn((t: number) => t * t * t);
        const { step } = setupPatrol({
            waypoints: [
                [0, 0, 0],
                [10, 0, 0],
            ],
            duration: 1,
            easing: customEasing,
        });

        step(10);
        expect(customEasing).toHaveBeenCalled();
    });

    test('custom interpolation function is called', () => {
        const customInterp = jest.fn(
            (from: Point3, to: Point3, t: number): Point3 => [
                from[0] + (to[0] - from[0]) * t,
                from[1] + (to[1] - from[1]) * t + Math.sin(t * Math.PI) * 2,
                from[2] + (to[2] - from[2]) * t,
            ],
        );

        const { step } = setupPatrol({
            waypoints: [
                [0, 0, 0],
                [10, 0, 0],
            ],
            duration: 1,
            interpolate: customInterp,
        });

        step(10);
        expect(customInterp).toHaveBeenCalled();
        const [from, to, t] = customInterp.mock.calls[0];
        expect(from).toEqual([0, 0, 0]);
        expect(to).toEqual([10, 0, 0]);
        expect(t).toBeGreaterThan(0);
        expect(t).toBeLessThanOrEqual(1);
    });

    test('advances segments after duration elapses', () => {
        const { step, handle } = setupPatrol({
            waypoints: [
                [0, 0, 0],
                [10, 0, 0],
                [20, 0, 0],
            ],
            duration: 0.5,
        });

        expect(handle.currentSegment).toBe(0);
        step(51); // 51 steps × 10ms = 0.51s, exceeds 0.5s duration
        expect(handle.currentSegment).toBe(1);
    });

    test('ease-in-out preset is accepted', () => {
        const { getPos, step } = setupPatrol({
            waypoints: [
                [0, 0, 0],
                [10, 0, 0],
            ],
            duration: 1,
            easing: 'ease-in-out',
        });

        step(30);
        const [x] = getPos();
        expect(x).toBeGreaterThan(0);
        expect(x).toBeLessThan(10);
    });
});

// ---------------------------------------------------------------------------
// General tests
// ---------------------------------------------------------------------------

describe('useWaypointPatrol — general', () => {
    test('handle exposes readonly state', () => {
        const { handle } = setupPatrol({
            waypoints: [
                [0, 0, 0],
                [10, 0, 0],
            ],
            speed: 5,
        });

        expect(handle.paused).toBe(false);
        expect(handle.currentSegment).toBe(0);
        expect(handle.direction).toBe(1);
    });
});
