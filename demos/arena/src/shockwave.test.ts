jest.mock(
    '@pulse-ts/core',
    () => ({
        defineStore: (name: string, factory: () => any) => ({
            _key: Symbol(name),
            _factory: factory,
        }),
        useStore: jest.fn(),
    }),
    { virtual: true },
);

jest.mock(
    '@pulse-ts/effects',
    () => ({
        useEffectPool: jest.fn(),
    }),
    { virtual: true },
);

jest.mock('three', () => ({
    Vector2: jest.fn().mockImplementation((x = 0, y = 0) => ({
        x,
        y,
        set(nx: number, ny: number) {
            this.x = nx;
            this.y = ny;
            return this;
        },
    })),
    Vector3: jest.fn().mockImplementation((x = 0, y = 0, z = 0) => ({
        x,
        y,
        z,
        project() {
            // Simple mock: return the raw coords as-is (in NDC -1..1 range)
            return this;
        },
    })),
}));

jest.mock('three/examples/jsm/postprocessing/ShaderPass.js', () => ({
    ShaderPass: jest.fn().mockImplementation((shader: any) => ({
        uniforms: { ...shader.uniforms },
        enabled: true,
    })),
}));

import {
    useShockwavePool,
    ShockwaveStore,
    syncShockwaveUniforms,
    createShockwavePass,
    worldToScreen,
    SHOCKWAVE_DURATION,
    MAX_SHOCKWAVES,
    SHOCKWAVE_MAX_RADIUS,
    SHOCKWAVE_STRENGTH,
    SHOCKWAVE_RING_WIDTH,
} from './shockwave';

describe('useShockwavePool', () => {
    it('is an exported function', () => {
        expect(typeof useShockwavePool).toBe('function');
    });
});

describe('ShockwaveStore', () => {
    it('is a defined store with a _key and _factory', () => {
        expect(ShockwaveStore._key).toBeDefined();
        expect(typeof ShockwaveStore._factory).toBe('function');
    });

    it('factory produces an object with null pool', () => {
        const state = ShockwaveStore._factory();
        expect(state.pool).toBeNull();
    });
});

describe('syncShockwaveUniforms', () => {
    it('disables the pass when pool has no active effects', () => {
        const pass = createShockwavePass();
        pass.enabled = true;

        const mockPool = {
            trigger: jest.fn(),
            active: () => [] as any[],
            hasActive: false,
            reset: jest.fn(),
        };

        syncShockwaveUniforms(mockPool, pass, 1.0);
        expect(pass.enabled).toBe(false);
    });

    it('enables the pass and writes uniforms when pool has active effects', () => {
        const pass = createShockwavePass();
        pass.enabled = false;

        const mockPool = {
            trigger: jest.fn(),
            active: () => [
                {
                    data: { centerX: 0.4, centerY: 0.6 },
                    age: SHOCKWAVE_DURATION / 2,
                    progress: 0.5,
                    active: true,
                },
            ],
            hasActive: true,
            reset: jest.fn(),
        };

        syncShockwaveUniforms(mockPool, pass, 1.5);
        expect(pass.enabled).toBe(true);

        expect(pass.uniforms['center0'].value.x).toBe(0.4);
        expect(pass.uniforms['center0'].value.y).toBe(0.6);
        expect(pass.uniforms['radius0'].value).toBeCloseTo(
            0.5 * SHOCKWAVE_MAX_RADIUS,
        );
        expect(pass.uniforms['strength0'].value).toBeCloseTo(
            SHOCKWAVE_STRENGTH * 0.5,
        );
        expect(pass.uniforms['aspect'].value).toBe(1.5);
    });

    it('sets strength to 0 for unused slots', () => {
        const pass = createShockwavePass();

        const mockPool = {
            trigger: jest.fn(),
            active: () => [],
            hasActive: false,
            reset: jest.fn(),
        };

        syncShockwaveUniforms(mockPool, pass, 1.0);
        for (let i = 0; i < MAX_SHOCKWAVES; i++) {
            expect(pass.uniforms[`strength${i}`].value).toBe(0);
        }
    });
});

describe('createShockwavePass', () => {
    it('returns a pass with expected uniforms', () => {
        const pass = createShockwavePass();
        expect(pass.uniforms['tDiffuse']).toBeDefined();
        expect(pass.uniforms['aspect']).toBeDefined();
        expect(pass.uniforms['ringWidth']).toBeDefined();
        for (let i = 0; i < MAX_SHOCKWAVES; i++) {
            expect(pass.uniforms[`center${i}`]).toBeDefined();
            expect(pass.uniforms[`radius${i}`]).toBeDefined();
            expect(pass.uniforms[`strength${i}`]).toBeDefined();
        }
    });

    it('starts disabled', () => {
        const pass = createShockwavePass();
        expect(pass.enabled).toBe(false);
    });
});

describe('worldToScreen', () => {
    it('converts NDC to 0..1 UV space', () => {
        const [u, v] = worldToScreen(0, 0, 0, {} as any);
        expect(u).toBeCloseTo(0.5);
        expect(v).toBeCloseTo(0.5);
    });
});

describe('constants', () => {
    it('have sensible ranges', () => {
        expect(SHOCKWAVE_DURATION).toBeGreaterThan(0);
        expect(SHOCKWAVE_DURATION).toBeLessThan(2);
        expect(MAX_SHOCKWAVES).toBeGreaterThanOrEqual(1);
        expect(SHOCKWAVE_MAX_RADIUS).toBeGreaterThan(0);
        expect(SHOCKWAVE_MAX_RADIUS).toBeLessThanOrEqual(1);
        expect(SHOCKWAVE_STRENGTH).toBeGreaterThan(0);
        expect(SHOCKWAVE_STRENGTH).toBeLessThan(1);
        expect(SHOCKWAVE_RING_WIDTH).toBeGreaterThan(0);
        expect(SHOCKWAVE_RING_WIDTH).toBeLessThan(1);
    });
});
