// ---------------------------------------------------------------------------
// Mock Three.js — must be before any import that touches 'three'
// ---------------------------------------------------------------------------

const mockDispose = jest.fn();
const mockSetDrawRange = jest.fn();
const mockSetAttribute = jest.fn();

jest.mock('three', () => ({
    BufferGeometry: jest.fn(() => ({
        setAttribute: mockSetAttribute,
        setDrawRange: mockSetDrawRange,
        dispose: mockDispose,
    })),
    BufferAttribute: jest.fn((array: Float32Array, itemSize: number) => ({
        array,
        itemSize,
        needsUpdate: false,
    })),
    ShaderMaterial: jest.fn(() => ({ dispose: mockDispose })),
    Points: jest.fn(() => ({ frustumCulled: true, parent: null })),
    AdditiveBlending: 1,
    NormalBlending: 0,
}));

jest.mock('@pulse-ts/three', () => ({
    useThreeRoot: jest.fn(() => ({
        position: { set: jest.fn() },
        add: jest.fn(),
    })),
    useObject3D: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { World } from '@pulse-ts/core';
import { installParticles } from './installParticles';
import { useParticleBurst, type BurstFn } from './useParticleBurst';
import { ParticlesService } from '../domain/ParticlesService';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TICK_MS = 16;

function setup(burstOptions: Parameters<typeof useParticleBurst>[0]) {
    const world = new World({ fixedStepMs: TICK_MS });
    let burst!: BurstFn;
    let service!: ParticlesService;

    function TestNode() {
        service = installParticles({ maxPerPool: 100 });
        burst = useParticleBurst(burstOptions);
    }

    world.mount(TestNode);

    const step = (steps = 1) => {
        for (let i = 0; i < steps; i++) world.tick(TICK_MS);
    };

    return { world, burst, service, step };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useParticleBurst', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('returns a function', () => {
        const { burst } = setup({
            count: 10,
            lifetime: 0.5,
            color: 0xff0000,
            speed: [1, 2],
        });
        expect(typeof burst).toBe('function');
    });

    test('burst spawns the specified number of particles', () => {
        const { burst, service } = setup({
            count: 12,
            lifetime: 1,
            color: 0xff0000,
            speed: [1, 2],
        });

        burst([0, 0, 0]);
        const managed = service.getPool('normal');
        expect(managed.pool.aliveCount).toBe(12);
    });

    test('particles die after their lifetime expires', () => {
        const { burst, service, step } = setup({
            count: 5,
            lifetime: 0.05,
            color: 0xff0000,
            speed: [1, 2],
        });

        burst([0, 0, 0]);
        expect(service.getPool('normal').pool.aliveCount).toBe(5);

        step(5); // 5 * 16ms = 80ms > 50ms lifetime
        expect(service.getPool('normal').pool.aliveCount).toBe(0);
    });

    test('gravity pulls particles down', () => {
        const { burst, service, step } = setup({
            count: 1,
            lifetime: 5,
            color: 0xff0000,
            speed: [0, 0],
            gravity: 100,
        });

        burst([0, 10, 0]);
        step(1);

        // After 16ms with gravity=100, velocity.y should decrease
        const pool = service.getPool('normal').pool;
        const p = pool.particles.find((p) => p.alive);
        expect(p).toBeDefined();
        expect(p!.velocity.y).toBeLessThan(0);
    });

    test('custom init callback runs after built-in', () => {
        const customInit = jest.fn();
        const { burst } = setup({
            count: 3,
            lifetime: 1,
            color: 0xff0000,
            speed: [1, 2],
            init: customInit,
        });

        burst([0, 0, 0]);
        expect(customInit).toHaveBeenCalledTimes(3);
    });

    test('custom update callback runs each tick', () => {
        const customUpdate = jest.fn();
        const { burst, step } = setup({
            count: 1,
            lifetime: 5,
            color: 0xff0000,
            speed: [0, 0],
            update: customUpdate,
        });

        burst([0, 0, 0]);
        step(3);
        expect(customUpdate).toHaveBeenCalledTimes(3);
    });

    test('additive blending uses separate pool', () => {
        const world = new World({ fixedStepMs: TICK_MS });
        let normalBurst!: BurstFn;
        let additiveBurst!: BurstFn;
        let service!: ParticlesService;

        function TestNode() {
            service = installParticles({ maxPerPool: 50 });
            normalBurst = useParticleBurst({
                count: 5,
                lifetime: 1,
                color: 0xff0000,
                speed: [1, 2],
                blending: 'normal',
            });
            additiveBurst = useParticleBurst({
                count: 3,
                lifetime: 1,
                color: 0x00ff00,
                speed: [1, 2],
                blending: 'additive',
            });
        }

        world.mount(TestNode);

        normalBurst([0, 0, 0]);
        additiveBurst([0, 0, 0]);

        expect(service.getPool('normal').pool.aliveCount).toBe(5);
        expect(service.getPool('additive').pool.aliveCount).toBe(3);
    });

    test('throws if installParticles was not called', () => {
        const world = new World({ fixedStepMs: TICK_MS });

        expect(() => {
            function TestNode() {
                useParticleBurst({
                    count: 1,
                    lifetime: 1,
                    color: 0xff0000,
                    speed: [1, 2],
                });
            }
            world.mount(TestNode);
        }).toThrow('ParticlesService not provided');
    });

    test('shrink option reduces particle size over time', () => {
        const { burst, service, step } = setup({
            count: 1,
            lifetime: 1,
            color: 0xff0000,
            speed: [0, 0],
            size: 0.1,
            shrink: true,
        });

        burst([0, 0, 0]);
        step(1); // 16ms

        const pool = service.getPool('normal').pool;
        const p = pool.particles.find((p) => p.alive);
        expect(p).toBeDefined();
        expect(p!.size).toBeLessThan(0.1);
    });
});
