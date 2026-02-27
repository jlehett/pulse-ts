/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// Mock Three.js
// ---------------------------------------------------------------------------

const mockDispose = jest.fn();
const mockSetDrawRange = jest.fn();
const mockSetAttribute = jest.fn();
const mockAdd = jest.fn();
const mockRemove = jest.fn();

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

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import {
    ParticlesService,
    genericUpdate,
    buildInit,
    buildUpdate,
} from './ParticlesService';
import type { Particle, Vec3Mut, ColorMut } from './ParticlePool';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createTestParticle(overrides: Partial<Particle> = {}): Particle {
    return {
        position: { x: 0, y: 0, z: 0, set: jest.fn().mockReturnThis(), randomDirection: jest.fn().mockReturnThis(), scale: jest.fn().mockReturnThis() } as unknown as Vec3Mut,
        velocity: { x: 0, y: 5, z: 0, set: jest.fn().mockReturnThis(), randomDirection: jest.fn().mockReturnThis(), scale: jest.fn().mockReturnThis() } as unknown as Vec3Mut,
        color: { r: 1, g: 1, b: 1, set: jest.fn() } as unknown as ColorMut,
        opacity: 1,
        size: 1,
        age: 0,
        lifetime: 1,
        alive: true,
        userData: {},
        ...overrides,
    };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ParticlesService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --- Construction ---

    test('uses default options when none provided', () => {
        const service = new ParticlesService();
        expect(service.maxPerPool).toBe(500);
        expect(service.defaultSize).toBe(0.08);
    });

    test('accepts custom options', () => {
        const service = new ParticlesService({ maxPerPool: 200, defaultSize: 0.1 });
        expect(service.maxPerPool).toBe(200);
        expect(service.defaultSize).toBe(0.1);
    });

    // --- Pool creation ---

    test('getPool lazily creates a pool', () => {
        const service = new ParticlesService({ maxPerPool: 10 });
        const managed = service.getPool('normal');

        expect(managed.pool).toBeDefined();
        expect(managed.pool.maxCount).toBe(10);
        expect(managed.geometry).toBeDefined();
        expect(managed.material).toBeDefined();
        expect(managed.points).toBeDefined();
    });

    test('getPool returns the same pool on subsequent calls', () => {
        const service = new ParticlesService({ maxPerPool: 10 });
        const a = service.getPool('normal');
        const b = service.getPool('normal');
        expect(a).toBe(b);
    });

    test('different blending modes create separate pools', () => {
        const service = new ParticlesService({ maxPerPool: 10 });
        const normal = service.getPool('normal');
        const additive = service.getPool('additive');
        expect(normal).not.toBe(additive);
    });

    test('getPool defaults to normal blending', () => {
        const service = new ParticlesService({ maxPerPool: 10 });
        const defaultPool = service.getPool();
        const normalPool = service.getPool('normal');
        expect(defaultPool).toBe(normalPool);
    });

    test('pool points are added to root when root is set first', () => {
        const service = new ParticlesService({ maxPerPool: 10 });
        const root = { add: mockAdd } as any;
        service.setRoot(root);

        service.getPool('normal');
        expect(mockAdd).toHaveBeenCalledTimes(1);
    });

    test('setRoot attaches already-created pools', () => {
        const service = new ParticlesService({ maxPerPool: 10 });
        service.getPool('normal');

        const root = { add: mockAdd } as any;
        service.setRoot(root);
        expect(mockAdd).toHaveBeenCalledTimes(1);
    });

    // --- Tick ---

    test('tick advances all pools', () => {
        const service = new ParticlesService({ maxPerPool: 10 });
        const managed = service.getPool('normal');

        // Burst some particles with a real init
        managed.pool.init = (p) => { p.lifetime = 5; };
        managed.pool.burst(3);
        expect(managed.pool.aliveCount).toBe(3);

        service.tick(0.016);
        // Particles should still be alive (lifetime = 5)
        expect(managed.pool.aliveCount).toBe(3);
    });

    test('tick syncs buffers and calls setDrawRange', () => {
        const service = new ParticlesService({ maxPerPool: 10 });
        const managed = service.getPool('normal');

        managed.pool.init = (p) => { p.lifetime = 5; };
        managed.pool.burst(2);
        service.tick(0.016);

        expect(mockSetDrawRange).toHaveBeenCalledWith(0, 2);
    });

    // --- Dispose ---

    test('dispose cleans up all Three.js resources', () => {
        const service = new ParticlesService({ maxPerPool: 10 });
        service.getPool('normal');
        service.getPool('additive');

        service.dispose();
        // 2 geometry + 2 material dispose calls
        expect(mockDispose).toHaveBeenCalledTimes(4);
    });
});

describe('genericUpdate', () => {
    test('applies gravity to velocity.y', () => {
        const p = createTestParticle({
            userData: { _gravity: 9.8 },
        });
        p.velocity.y = 5;

        genericUpdate(p, 0.1);
        expect(p.velocity.y).toBeCloseTo(5 - 9.8 * 0.1);
    });

    test('fades opacity based on age/lifetime', () => {
        const p = createTestParticle({
            age: 0.5,
            lifetime: 1,
            userData: { _fadeOut: true },
        });

        genericUpdate(p, 0.016);
        expect(p.opacity).toBeCloseTo(0.5);
    });

    test('shrinks size based on age/lifetime', () => {
        const p = createTestParticle({
            age: 0.5,
            lifetime: 1,
            size: 0.08,
            userData: { _shrink: true, _baseSize: 0.08 },
        });

        genericUpdate(p, 0.016);
        expect(p.size).toBeCloseTo(0.04);
    });

    test('no-ops when no flags set', () => {
        const p = createTestParticle({ userData: {} });
        p.velocity.y = 5;
        p.opacity = 1;
        p.size = 0.08;

        genericUpdate(p, 0.1);
        expect(p.velocity.y).toBe(5);
        expect(p.opacity).toBe(1);
        expect(p.size).toBe(0.08);
    });
});

describe('buildInit', () => {
    test('sets particle properties from options', () => {
        const init = buildInit(
            { lifetime: 0.5, color: 0xff0000, speed: [2, 4] },
            0.08,
        );

        const p = createTestParticle();
        init(p);

        expect(p.lifetime).toBe(0.5);
        expect(p.color.set).toHaveBeenCalledWith(0xff0000);
        expect(p.velocity.randomDirection).toHaveBeenCalled();
        expect(p.velocity.scale).toHaveBeenCalled();
        expect(p.size).toBe(0.08);
        expect(p.opacity).toBe(1);
        expect(p.userData._fadeOut).toBe(true);
    });

    test('uses explicit size over defaultSize', () => {
        const init = buildInit(
            { lifetime: 1, color: 0xff0000, speed: [1, 2], size: 0.2 },
            0.08,
        );

        const p = createTestParticle();
        init(p);

        expect(p.size).toBe(0.2);
        expect(p.userData._baseSize).toBe(0.2);
    });

    test('writes gravity and shrink flags to userData', () => {
        const init = buildInit(
            { lifetime: 1, color: 0xff0000, speed: [1, 2], gravity: 9.8, shrink: true },
            0.08,
        );

        const p = createTestParticle();
        init(p);

        expect(p.userData._gravity).toBe(9.8);
        expect(p.userData._shrink).toBe(true);
    });

    test('runs user init after built-in init', () => {
        const userInit = jest.fn();
        const init = buildInit(
            { lifetime: 1, color: 0xff0000, speed: [1, 2], init: userInit },
            0.08,
        );

        const p = createTestParticle();
        init(p);

        expect(userInit).toHaveBeenCalledWith(p);
        // User init runs after built-in, so lifetime is already set
        expect(p.lifetime).toBe(1);
    });

    test('uses custom opacity', () => {
        const init = buildInit(
            { lifetime: 1, color: 0xff0000, speed: [1, 2], opacity: 0.5 },
            0.08,
        );

        const p = createTestParticle();
        init(p);

        expect(p.opacity).toBe(0.5);
    });
});

describe('buildUpdate', () => {
    test('runs genericUpdate then user update', () => {
        const callOrder: string[] = [];

        const userUpdate = jest.fn(() => { callOrder.push('user'); });
        const update = buildUpdate({
            lifetime: 1, color: 0, speed: [0, 0],
            gravity: 9.8, update: userUpdate,
        });

        const p = createTestParticle({
            userData: { _gravity: 9.8, _fadeOut: true },
        });
        p.velocity.y = 5;

        update(p, 0.1);
        // gravity was applied (generic update ran)
        expect(p.velocity.y).toBeCloseTo(5 - 9.8 * 0.1);
        // user update also ran
        expect(userUpdate).toHaveBeenCalledWith(p, 0.1);
    });

    test('works without user update', () => {
        const update = buildUpdate({
            lifetime: 1, color: 0, speed: [0, 0],
        });

        const p = createTestParticle({ userData: { _fadeOut: true }, age: 0.5, lifetime: 1 });
        update(p, 0.016);

        expect(p.opacity).toBeCloseTo(0.5);
    });
});
