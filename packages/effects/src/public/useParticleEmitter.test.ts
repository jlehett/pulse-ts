/* eslint-disable @typescript-eslint/no-explicit-any */

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
import { useParticleEmitter, type EmitterHandle } from './useParticleEmitter';
import { ParticlesService } from '../domain/ParticlesService';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TICK_MS = 16;

function setup(emitterOptions: Parameters<typeof useParticleEmitter>[0]) {
    const world = new World({ fixedStepMs: TICK_MS });
    let handle!: EmitterHandle;
    let service!: ParticlesService;

    function TestNode() {
        service = installParticles({ maxPerPool: 200 });
        handle = useParticleEmitter(emitterOptions);
    }

    world.mount(TestNode);

    const step = (steps = 1) => {
        for (let i = 0; i < steps; i++) world.tick(TICK_MS);
    };

    return { world, handle, service, step };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useParticleEmitter', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('returns an EmitterHandle', () => {
        const { handle } = setup({
            rate: 50, lifetime: 1, color: 0xff0000, speed: [1, 2],
        });

        expect(typeof handle.pause).toBe('function');
        expect(typeof handle.resume).toBe('function');
        expect(typeof handle.active).toBe('boolean');
    });

    test('emits particles over time when active', () => {
        const { service, step } = setup({
            rate: 100, lifetime: 10, color: 0xff0000, speed: [1, 2],
        });

        step(10); // 10 * 16ms = 160ms → ~16 particles at rate=100
        const pool = service.getPool('normal').pool;
        expect(pool.aliveCount).toBeGreaterThanOrEqual(15);
        expect(pool.aliveCount).toBeLessThanOrEqual(17);
    });

    test('starts active by default', () => {
        const { handle } = setup({
            rate: 50, lifetime: 1, color: 0xff0000, speed: [1, 2],
        });

        expect(handle.active).toBe(true);
    });

    test('autoStart: false starts paused', () => {
        const { handle, service, step } = setup({
            rate: 100, lifetime: 10, color: 0xff0000, speed: [1, 2],
            autoStart: false,
        });

        expect(handle.active).toBe(false);

        step(10);
        const pool = service.getPool('normal').pool;
        expect(pool.aliveCount).toBe(0);
    });

    test('pause() stops emission', () => {
        const { handle, service, step } = setup({
            rate: 100, lifetime: 10, color: 0xff0000, speed: [1, 2],
        });

        step(5); // emit some
        handle.pause();
        const countAfterPause = service.getPool('normal').pool.aliveCount;

        step(10); // no new particles
        expect(service.getPool('normal').pool.aliveCount).toBe(countAfterPause);
    });

    test('resume() restarts emission', () => {
        const { handle, service, step } = setup({
            rate: 100, lifetime: 10, color: 0xff0000, speed: [1, 2],
            autoStart: false,
        });

        step(5); // no particles emitted
        expect(service.getPool('normal').pool.aliveCount).toBe(0);

        handle.resume();
        step(10); // should emit now
        expect(service.getPool('normal').pool.aliveCount).toBeGreaterThan(0);
    });

    test('custom update callback runs each tick', () => {
        const customUpdate = jest.fn();
        const { step } = setup({
            rate: 100, lifetime: 5, color: 0xff0000, speed: [0, 0],
            update: customUpdate,
        });

        step(5); // emit + update
        expect(customUpdate.mock.calls.length).toBeGreaterThan(0);
    });

    test('throws if installParticles was not called', () => {
        const world = new World({ fixedStepMs: TICK_MS });

        expect(() => {
            function TestNode() {
                useParticleEmitter({
                    rate: 50, lifetime: 1, color: 0xff0000, speed: [1, 2],
                });
            }
            world.mount(TestNode);
        }).toThrow('ParticlesService not provided');
    });

    test('uses additive blending when specified', () => {
        const { service, step } = setup({
            rate: 100, lifetime: 10, color: 0xff0000, speed: [1, 2],
            blending: 'additive',
        });

        step(5);
        expect(service.getPool('additive').pool.aliveCount).toBeGreaterThan(0);
    });
});
