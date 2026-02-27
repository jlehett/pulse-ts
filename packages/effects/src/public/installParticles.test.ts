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

const mockRootPosition = { set: jest.fn() };
const mockRoot = { position: mockRootPosition, add: jest.fn() };

jest.mock('@pulse-ts/three', () => ({
    useThreeRoot: jest.fn(() => mockRoot),
    useObject3D: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { World } from '@pulse-ts/core';
import { installParticles } from './installParticles';
import { ParticlesService } from '../domain/ParticlesService';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TICK_MS = 16;

function setup(options?: Parameters<typeof installParticles>[0]) {
    const world = new World({ fixedStepMs: TICK_MS });
    let service!: ParticlesService;

    function TestNode() {
        service = installParticles(options);
    }

    world.mount(TestNode);
    return { world, service };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('installParticles', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('registers ParticlesService on the world', () => {
        const { world } = setup();
        const service = world.getService(ParticlesService);
        expect(service).toBeDefined();
        expect(service).toBeInstanceOf(ParticlesService);
    });

    test('returns the ParticlesService', () => {
        const { service } = setup();
        expect(service).toBeInstanceOf(ParticlesService);
    });

    test('sets root position to origin', () => {
        setup();
        expect(mockRootPosition.set).toHaveBeenCalledWith(0, 0, 0);
    });

    test('passes options through to service', () => {
        const { service } = setup({ maxPerPool: 200, defaultSize: 0.2 });
        expect(service.maxPerPool).toBe(200);
        expect(service.defaultSize).toBe(0.2);
    });

    test('ticking the world ticks the service', () => {
        const { world, service } = setup();

        // Create a pool and burst some particles
        const managed = service.getPool('normal');
        managed.pool.init = (p) => {
            p.lifetime = 5;
        };
        managed.pool.burst(3);

        world.tick(TICK_MS);
        // setDrawRange should have been called for the 3 alive particles
        expect(mockSetDrawRange).toHaveBeenCalledWith(0, 3);
    });
});
