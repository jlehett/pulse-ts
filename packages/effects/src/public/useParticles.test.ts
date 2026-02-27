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
    Points: jest.fn(() => ({ frustumCulled: true })),
    AdditiveBlending: 1,
    NormalBlending: 0,
}));

jest.mock('@pulse-ts/three', () => ({
    useThreeRoot: jest.fn(() => ({
        position: { set: jest.fn() },
    })),
    useObject3D: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { World } from '@pulse-ts/core';
import { useParticles } from './useParticles';
import type { ParticleEmitter } from './useParticles';
import type { InitFn } from '../domain/ParticlePool';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TICK_MS = 16;

function setup(options: Parameters<typeof useParticles>[0]) {
    const world = new World({ fixedStepMs: TICK_MS });
    let emitter!: ParticleEmitter;

    function TestNode() {
        emitter = useParticles(options);
    }

    world.mount(TestNode);

    const step = (steps = 1) => {
        for (let i = 0; i < steps; i++) world.tick(TICK_MS);
    };

    return { world, emitter, step };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useParticles — hook integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('returns an emitter with the expected API', () => {
        const { emitter } = setup({ maxCount: 10 });

        expect(typeof emitter.burst).toBe('function');
        expect(typeof emitter.rate).toBe('number');
        expect(typeof emitter.emitting).toBe('boolean');
        expect(typeof emitter.aliveCount).toBe('number');
    });

    test('burst() spawns particles that are alive', () => {
        const { emitter } = setup({
            maxCount: 50,
            init: (p) => {
                p.lifetime = 5;
            },
        });

        emitter.burst(10, [0, 0, 0]);
        expect(emitter.aliveCount).toBe(10);
    });

    test('particles die after their lifetime expires', () => {
        const { emitter, step } = setup({
            maxCount: 10,
            init: (p) => {
                p.lifetime = 0.05;
            },
        });

        emitter.burst(5);
        expect(emitter.aliveCount).toBe(5);

        step(5); // 5 × 16ms = 80ms = 0.08s > 0.05s
        expect(emitter.aliveCount).toBe(0);
    });

    test('continuous emission spawns particles over time', () => {
        const { emitter, step } = setup({
            maxCount: 200,
            init: (p) => {
                p.lifetime = 10;
            },
        });

        emitter.rate = 100;
        emitter.emitting = true;

        step(10); // 10 × 16ms = 160ms → 100 * 0.16 = 16 particles
        expect(emitter.aliveCount).toBeGreaterThanOrEqual(15);
        expect(emitter.aliveCount).toBeLessThanOrEqual(17);
    });

    test('init callback receives default size from options', () => {
        const sizes: number[] = [];
        const { emitter } = setup({
            maxCount: 10,
            size: 0.08,
            init: (p) => {
                sizes.push(p.size);
                p.lifetime = 5;
            },
        });

        emitter.burst(3);
        // Default size should have been applied before init
        expect(sizes).toEqual([0.08, 0.08, 0.08]);
    });

    test('burst initOverride receives default size', () => {
        const sizes: number[] = [];
        const poolInit = jest.fn();
        const { emitter } = setup({
            maxCount: 10,
            size: 0.12,
            init: poolInit,
        });

        const override: InitFn = (p) => {
            sizes.push(p.size);
            p.lifetime = 5;
        };
        emitter.burst(2, [0, 0, 0], override);

        expect(poolInit).not.toHaveBeenCalled();
        expect(sizes).toEqual([0.12, 0.12]);
    });

    test('update callback runs each tick', () => {
        const updateFn = jest.fn();
        const { emitter, step } = setup({
            maxCount: 10,
            init: (p) => {
                p.lifetime = 5;
            },
            update: updateFn,
        });

        emitter.burst(1);
        step(3);
        expect(updateFn).toHaveBeenCalledTimes(3);
    });

    test('Three.js geometry is created with required attributes', () => {
        setup({ maxCount: 10 });

        // 4 setAttribute calls: position, aColor, aOpacity, aSize
        expect(mockSetAttribute).toHaveBeenCalledTimes(4);
        const names = mockSetAttribute.mock.calls.map(
            (c: any[]) => c[0] as string,
        );
        expect(names).toContain('position');
        expect(names).toContain('aColor');
        expect(names).toContain('aOpacity');
        expect(names).toContain('aSize');
    });

    test('setDrawRange is called after ticking with alive particles', () => {
        const { emitter, step } = setup({
            maxCount: 20,
            init: (p) => {
                p.lifetime = 5;
            },
        });

        emitter.burst(7);
        step(1);
        expect(mockSetDrawRange).toHaveBeenCalledWith(0, 7);
    });

    test('Points object has frustumCulled disabled', () => {
        const THREE = jest.requireMock('three');
        setup({ maxCount: 10 });

        // The Points constructor is called once
        expect(THREE.Points).toHaveBeenCalledTimes(1);
        // The resulting object should have frustumCulled set to false
        const pointsInstance = THREE.Points.mock.results[0].value;
        expect(pointsInstance.frustumCulled).toBe(false);
    });
});
