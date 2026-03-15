jest.mock(
    '@pulse-ts/core',
    () => ({
        defineStore: (name: string, factory: () => any) => ({
            _key: Symbol(name),
            _factory: factory,
        }),
        useStore: jest.fn(),
        useComponent: jest.fn(),
        Transform: {},
        useFrameUpdate: jest.fn(),
    }),
    { virtual: true },
);

jest.mock(
    '@pulse-ts/effects',
    () => ({
        useEffectPool: jest.fn(),
        useAnimate: jest.fn(() => ({ value: 0 })),
    }),
    { virtual: true },
);

jest.mock(
    '@pulse-ts/physics',
    () => ({
        useRigidBody: jest.fn(),
        useCylinderCollider: jest.fn(),
    }),
    { virtual: true },
);

jest.mock(
    '@pulse-ts/three',
    () => ({
        useMesh: jest.fn(() => ({ material: {} })),
        useCustomMesh: jest.fn(() => ({
            object: { position: { y: 0 }, rotation: { x: 0, y: 0 } },
            material: {},
        })),
        useThreeContext: jest.fn(() => ({ scene: { traverse: jest.fn() } })),
        createTexture: jest.fn((size: number) => {
            const data = new Uint8Array(size * size * 4);
            return { width: size, height: size, data, needsUpdate: false };
        }),
        createTexture1D: jest.fn((size: number) => {
            const data = new Uint8Array(size * 4);
            return { data, offset: { x: 0 }, needsUpdate: false };
        }),
    }),
    { virtual: true },
);

import {
    PLATFORM_RADIUS,
    PLATFORM_HEIGHT,
    createGridNormalMap,
    createGridEmissiveMap,
    createEnergyLineMap,
    createRingGlowMap,
    createWakeMap,
    rasterizeWake,
    worldToUV,
    RIPPLE_INTERVAL,
    RIPPLE_DURATION,
    RIPPLE_INTENSITY,
    WAKE_MAP_SIZE,
    WAKE_DISPLACEMENT,
    WAKE_MIN_DISTANCE,
    WAKE_RADIUS,
    WAKE_THIN_START,
    WAKE_TRAIL_INTERVAL,
    WAKE_TRAIL_DECAY,
    WAKE_MAX_TRAIL,
} from './PlatformNode';
import type { WakeTrailPoint } from './PlatformNode';
import { ARENA_RADIUS } from '../config/arena';
import {
    HIT_RIPPLE_DISPLACEMENT,
    HIT_RIPPLE_MAX_RADIUS,
    HIT_RIPPLE_EXPAND_DURATION,
    HIT_RIPPLE_RING_WIDTH,
    HIT_IMPACT_DURATION,
} from '../hitImpact';

jest.mock('three', () => ({
    DataTexture: jest.fn().mockImplementation((data, w, h) => ({
        data,
        image: { data },
        width: w,
        height: h,
        wrapS: 0,
        wrapT: 0,
        needsUpdate: false,
        magFilter: 0,
        minFilter: 0,
    })),
    RGBAFormat: 1023,
    RepeatWrapping: 1000,
    LinearFilter: 1006,
}));

describe('PlatformNode constants', () => {
    it('platform radius matches arena config radius', () => {
        expect(PLATFORM_RADIUS).toBe(ARENA_RADIUS);
    });

    it('platform radius is positive', () => {
        expect(PLATFORM_RADIUS).toBeGreaterThan(0);
    });

    it('platform height is positive and thin', () => {
        expect(PLATFORM_HEIGHT).toBeGreaterThan(0);
        expect(PLATFORM_HEIGHT).toBeLessThanOrEqual(1);
    });

    it('platform height is 0.5', () => {
        expect(PLATFORM_HEIGHT).toBe(0.5);
    });
});

describe('createGridNormalMap', () => {
    it('returns a DataTexture with correct dimensions', () => {
        const tex = createGridNormalMap(64, 16);
        expect(tex.width).toBe(64);
        expect(tex.height).toBe(64);
    });

    it('creates RGBA data buffer of correct size', () => {
        const tex = createGridNormalMap(32, 8);
        expect(tex.data).toBeInstanceOf(Uint8Array);
        expect(tex.data.length).toBe(32 * 32 * 4);
    });

    it('sets flat normal at non-grid pixels', () => {
        const tex = createGridNormalMap(64, 32);
        // Pixel (1, 1) is not on a grid line
        const i = (1 * 64 + 1) * 4;
        expect(tex.data[i]).toBe(128); // nx
        expect(tex.data[i + 1]).toBe(128); // ny
        expect(tex.data[i + 2]).toBe(255); // nz
        expect(tex.data[i + 3]).toBe(255); // alpha
    });

    it('perturbs normals at grid-line pixels', () => {
        const tex = createGridNormalMap(64, 32);
        // Pixel (32, 1) is on a vertical grid line
        const i = (1 * 64 + 32) * 4;
        expect(tex.data[i]).toBe(96); // tilted nx
    });
});

describe('createGridEmissiveMap', () => {
    it('returns a DataTexture with correct dimensions', () => {
        const tex = createGridEmissiveMap(64, 16, 2);
        expect(tex.width).toBe(64);
        expect(tex.height).toBe(64);
    });

    it('creates RGBA data buffer of correct size', () => {
        const tex = createGridEmissiveMap(32, 8, 1);
        expect(tex.data).toBeInstanceOf(Uint8Array);
        expect(tex.data.length).toBe(32 * 32 * 4);
    });

    it('has bright pixels on grid lines and dark interiors', () => {
        const tex = createGridEmissiveMap(64, 16, 2);
        let brightCount = 0;
        let darkCount = 0;
        for (let j = 0; j < tex.data.length; j += 4) {
            const maxChannel = Math.max(
                tex.data[j],
                tex.data[j + 1],
                tex.data[j + 2],
            );
            if (maxChannel > 50) brightCount++;
            else darkCount++;
        }
        expect(brightCount).toBeGreaterThan(0);
        expect(darkCount).toBeGreaterThan(brightCount);
    });

    it('grid lines are on spacing boundaries', () => {
        const tex = createGridEmissiveMap(64, 16, 1);
        // Pixel (0, 5) is on a vertical grid line
        const iOnLine = (5 * 64 + 0) * 4;
        expect(tex.data[iOnLine + 1]).toBeGreaterThan(0);

        // Pixel (8, 5) is not on a grid line
        const iOffLine = (5 * 64 + 8) * 4;
        expect(tex.data[iOffLine]).toBe(0);
        expect(tex.data[iOffLine + 1]).toBe(0);
        expect(tex.data[iOffLine + 2]).toBe(0);
    });
});

describe('createEnergyLineMap', () => {
    it('returns a DataTexture with correct dimensions', () => {
        const tex = createEnergyLineMap(64, 8);
        expect(tex.width).toBe(64);
        expect(tex.height).toBe(64);
    });

    it('creates RGBA data buffer of correct size', () => {
        const tex = createEnergyLineMap(32, 6);
        expect(tex.data).toBeInstanceOf(Uint8Array);
        expect(tex.data.length).toBe(32 * 32 * 4);
    });

    it('has some non-zero pixels for spoke lines', () => {
        const tex = createEnergyLineMap(128, 12);
        let nonZero = 0;
        for (let j = 0; j < tex.data.length; j += 4) {
            if (tex.data[j] > 0 || tex.data[j + 1] > 0 || tex.data[j + 2] > 0) {
                nonZero++;
            }
        }
        expect(nonZero).toBeGreaterThan(0);
    });
});

describe('createRingGlowMap', () => {
    it('returns a DataTexture with correct dimensions', () => {
        const tex = createRingGlowMap(128);
        expect(tex.width).toBe(128);
        expect(tex.height).toBe(1);
    });

    it('creates RGBA data buffer of correct size', () => {
        const tex = createRingGlowMap(64);
        expect(tex.data).toBeInstanceOf(Uint8Array);
        expect(tex.data.length).toBe(64 * 4);
    });

    it('has brightest pixel at x=0 (glow center)', () => {
        const tex = createRingGlowMap(256);
        const centerBrightness = tex.data[0];
        // Midpoint (opposite side) should be dimmer
        const midIdx = 128 * 4;
        const midBrightness = tex.data[midIdx];
        expect(centerBrightness).toBeGreaterThan(midBrightness);
    });

    it('has no fully black pixels (base glow present)', () => {
        const tex = createRingGlowMap(256);
        for (let x = 0; x < 256; x++) {
            expect(tex.data[x * 4]).toBeGreaterThan(0);
        }
    });
});

describe('ripple constants', () => {
    it('RIPPLE_INTERVAL is positive', () => {
        expect(RIPPLE_INTERVAL).toBeGreaterThan(0);
    });

    it('RIPPLE_DURATION is positive and shorter than interval', () => {
        expect(RIPPLE_DURATION).toBeGreaterThan(0);
        expect(RIPPLE_DURATION).toBeLessThanOrEqual(RIPPLE_INTERVAL);
    });

    it('RIPPLE_INTENSITY is positive', () => {
        expect(RIPPLE_INTENSITY).toBeGreaterThan(0);
    });
});

describe('wake constants', () => {
    it('WAKE_MAP_SIZE is a positive power of 2', () => {
        expect(WAKE_MAP_SIZE).toBeGreaterThan(0);
        expect(WAKE_MAP_SIZE & (WAKE_MAP_SIZE - 1)).toBe(0);
    });

    it('WAKE_DISPLACEMENT is positive', () => {
        expect(WAKE_DISPLACEMENT).toBeGreaterThan(0);
    });

    it('WAKE_MIN_DISTANCE is positive', () => {
        expect(WAKE_MIN_DISTANCE).toBeGreaterThan(0);
    });

    it('WAKE_THIN_START is between 0 and 1', () => {
        expect(WAKE_THIN_START).toBeGreaterThan(0);
        expect(WAKE_THIN_START).toBeLessThan(1);
    });

    it('WAKE_RADIUS is positive', () => {
        expect(WAKE_RADIUS).toBeGreaterThan(0);
    });

    it('WAKE_TRAIL_INTERVAL is positive', () => {
        expect(WAKE_TRAIL_INTERVAL).toBeGreaterThan(0);
    });

    it('WAKE_TRAIL_DECAY is positive', () => {
        expect(WAKE_TRAIL_DECAY).toBeGreaterThan(0);
    });

    it('WAKE_MAX_TRAIL is positive', () => {
        expect(WAKE_MAX_TRAIL).toBeGreaterThan(0);
    });
});

describe('createWakeMap', () => {
    it('returns a DataTexture with correct dimensions', () => {
        const tex = createWakeMap(32);
        expect(tex.width).toBe(32);
        expect(tex.height).toBe(32);
    });

    it('creates RGBA data buffer of correct size', () => {
        const tex = createWakeMap(16);
        expect(tex.data).toBeInstanceOf(Uint8Array);
        expect(tex.data.length).toBe(16 * 16 * 4);
    });

    it('buffer is initialized to zero displacement (R=128, G=128)', () => {
        const tex = createWakeMap(8);
        for (let i = 0; i < tex.data.length; i += 4) {
            // R and G default to 0 from Uint8Array, but after rasterizeWake
            // they would be 128. createWakeMap just creates a zeroed buffer.
            expect(tex.data[i]).toBe(0);
            expect(tex.data[i + 1]).toBe(0);
        }
    });
});

describe('rasterizeWake', () => {
    const SIZE = 64;

    function makeBuffer(): Uint8Array {
        return new Uint8Array(SIZE * SIZE * 4);
    }

    /** Helper: trail point moving in +X direction (maps to +cy in texel space). */
    function movingRight(x = 0, z = 0, strength = 1): WakeTrailPoint {
        return { x, z, strength, dirX: 1, dirZ: 0 };
    }

    it('empty trail sets all pixels to neutral displacement (R=128, G=128)', () => {
        const data = makeBuffer();
        data[0] = 200;
        data[1] = 50;
        rasterizeWake(data, SIZE, [], ARENA_RADIUS, WAKE_RADIUS);
        for (let i = 0; i < data.length; i += 4) {
            expect(data[i]).toBe(128);
            expect(data[i + 1]).toBe(128);
        }
    });

    it('sets alpha to 255', () => {
        const data = makeBuffer();
        rasterizeWake(data, SIZE, [], ARENA_RADIUS, WAKE_RADIUS);
        for (let i = 3; i < data.length; i += 4) {
            expect(data[i]).toBe(255);
        }
    });

    it('center splat displaces nearby texels perpendicularly (R or G != 128)', () => {
        const data = makeBuffer();
        rasterizeWake(data, SIZE, [movingRight()], ARENA_RADIUS, WAKE_RADIUS);
        // Moving +X (texel +Y), perpendicular is texel X axis.
        // Offset by 1 texel in perpendicular direction (within thin radius).
        const cx = Math.floor(SIZE / 2);
        const cy = Math.floor(SIZE / 2);
        const idx = (cy * SIZE + (cx + 1)) * 4;
        const displaced = data[idx] !== 128 || data[idx + 1] !== 128;
        expect(displaced).toBe(true);
    });

    it('texel on the movement line has zero displacement', () => {
        const data = makeBuffer();
        rasterizeWake(data, SIZE, [movingRight()], ARENA_RADIUS, WAKE_RADIUS);
        // Moving +X → texel dir is +Y. A texel directly along the movement
        // line (same column, offset row) has perpDot ≈ 0 → no displacement.
        const cx = Math.floor(SIZE / 2);
        const cy = Math.floor(SIZE / 2);
        const idx = ((cy + 1) * SIZE + cx) * 4;
        expect(data[idx]).toBe(128);
        expect(data[idx + 1]).toBe(128);
    });

    it('far texels remain neutral (R=128, G=128)', () => {
        const data = makeBuffer();
        rasterizeWake(data, SIZE, [movingRight()], ARENA_RADIUS, WAKE_RADIUS);
        const idx = 0; // pixel (0, 0) — far corner
        expect(data[idx]).toBe(128);
        expect(data[idx + 1]).toBe(128);
    });

    it('strength scales displacement magnitude', () => {
        const dataFull = makeBuffer();
        const dataHalf = makeBuffer();
        rasterizeWake(
            dataFull,
            SIZE,
            [movingRight(0, 0, 1)],
            ARENA_RADIUS,
            WAKE_RADIUS,
        );
        rasterizeWake(
            dataHalf,
            SIZE,
            [movingRight(0, 0, 0.5)],
            ARENA_RADIUS,
            WAKE_RADIUS,
        );
        const cx = Math.floor(SIZE / 2);
        const cy = Math.floor(SIZE / 2);
        // Use offset 1 — within thin radius for both strength values
        const idx = (cy * SIZE + (cx + 1)) * 4;
        const magFull =
            Math.abs(dataFull[idx] - 128) + Math.abs(dataFull[idx + 1] - 128);
        const magHalf =
            Math.abs(dataHalf[idx] - 128) + Math.abs(dataHalf[idx + 1] - 128);
        expect(magFull).toBeGreaterThan(magHalf);
    });

    it('overlapping splats accumulate displacement', () => {
        const dataSingle = makeBuffer();
        const dataDouble = makeBuffer();
        rasterizeWake(
            dataSingle,
            SIZE,
            [movingRight(0, 0, 0.3)],
            ARENA_RADIUS,
            WAKE_RADIUS,
        );
        rasterizeWake(
            dataDouble,
            SIZE,
            [movingRight(0, 0, 0.3), movingRight(0, 0, 0.3)],
            ARENA_RADIUS,
            WAKE_RADIUS,
        );
        const cx = Math.floor(SIZE / 2);
        const cy = Math.floor(SIZE / 2);
        const idx = (cy * SIZE + (cx + 1)) * 4;
        const magSingle =
            Math.abs(dataSingle[idx] - 128) +
            Math.abs(dataSingle[idx + 1] - 128);
        const magDouble =
            Math.abs(dataDouble[idx] - 128) +
            Math.abs(dataDouble[idx + 1] - 128);
        expect(magDouble).toBeGreaterThan(magSingle);
    });

    it('clamps encoded values to [0, 255] range', () => {
        const data = makeBuffer();
        const trail: WakeTrailPoint[] = [];
        for (let i = 0; i < 20; i++) {
            trail.push(movingRight(0, 0, 1));
        }
        rasterizeWake(data, SIZE, trail, ARENA_RADIUS, WAKE_RADIUS);
        for (let i = 0; i < data.length; i += 4) {
            expect(data[i]).toBeGreaterThanOrEqual(0);
            expect(data[i]).toBeLessThanOrEqual(255);
            expect(data[i + 1]).toBeGreaterThanOrEqual(0);
            expect(data[i + 1]).toBeLessThanOrEqual(255);
        }
    });

    it('fresh trail points produce narrower wake than decayed ones', () => {
        const dataFresh = makeBuffer();
        const dataDecayed = makeBuffer();
        rasterizeWake(
            dataFresh,
            SIZE,
            [movingRight(0, 0, 1)],
            ARENA_RADIUS,
            WAKE_RADIUS,
        );
        rasterizeWake(
            dataDecayed,
            SIZE,
            [movingRight(0, 0, 0.2)],
            ARENA_RADIUS,
            WAKE_RADIUS,
        );
        let freshCount = 0;
        let decayedCount = 0;
        for (let i = 0; i < dataFresh.length; i += 4) {
            if (dataFresh[i] !== 128 || dataFresh[i + 1] !== 128) freshCount++;
            if (dataDecayed[i] !== 128 || dataDecayed[i + 1] !== 128)
                decayedCount++;
        }
        expect(decayedCount).toBeGreaterThan(freshCount);
    });

    it('displacement is opposite on each side of the trail line', () => {
        const data = makeBuffer();
        // Use decayed strength so radius is wide enough to cover offset ±3
        rasterizeWake(
            data,
            SIZE,
            [movingRight(0, 0, 0.3)],
            ARENA_RADIUS,
            WAKE_RADIUS,
        );
        const cx = Math.floor(SIZE / 2);
        const cy = Math.floor(SIZE / 2);
        const idxLeft = (cy * SIZE + (cx - 3)) * 4;
        const idxRight = (cy * SIZE + (cx + 3)) * 4;
        const rLeft = data[idxLeft] - 128;
        const rRight = data[idxRight] - 128;
        expect(rLeft * rRight).toBeLessThan(0);
    });
});

describe('worldToUV', () => {
    it('maps arena center (0, 0) to UV (0.5, 0.5)', () => {
        const [u, v] = worldToUV(0, 0, ARENA_RADIUS);
        expect(u).toBeCloseTo(0.5);
        expect(v).toBeCloseTo(0.5);
    });

    it('maps positive X edge to v=1', () => {
        const [u, v] = worldToUV(ARENA_RADIUS, 0, ARENA_RADIUS);
        expect(u).toBeCloseTo(0.5);
        expect(v).toBeCloseTo(1.0);
    });

    it('maps negative X edge to v=0', () => {
        const [u, v] = worldToUV(-ARENA_RADIUS, 0, ARENA_RADIUS);
        expect(u).toBeCloseTo(0.5);
        expect(v).toBeCloseTo(0.0);
    });

    it('maps positive Z edge to u=1', () => {
        const [u, v] = worldToUV(0, ARENA_RADIUS, ARENA_RADIUS);
        expect(u).toBeCloseTo(1.0);
        expect(v).toBeCloseTo(0.5);
    });

    it('maps negative Z edge to u=0', () => {
        const [u, v] = worldToUV(0, -ARENA_RADIUS, ARENA_RADIUS);
        expect(u).toBeCloseTo(0.0);
        expect(v).toBeCloseTo(0.5);
    });

    it('returns values in 0-1 range for positions within arena', () => {
        const [u, v] = worldToUV(3, -2, ARENA_RADIUS);
        expect(u).toBeGreaterThanOrEqual(0);
        expect(u).toBeLessThanOrEqual(1);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
    });
});

describe('hit ripple constants', () => {
    it('HIT_RIPPLE_DISPLACEMENT is positive and less than 1', () => {
        expect(HIT_RIPPLE_DISPLACEMENT).toBeGreaterThan(0);
        expect(HIT_RIPPLE_DISPLACEMENT).toBeLessThan(1);
    });

    it('HIT_RIPPLE_MAX_RADIUS is between 0 and 1', () => {
        expect(HIT_RIPPLE_MAX_RADIUS).toBeGreaterThan(0);
        expect(HIT_RIPPLE_MAX_RADIUS).toBeLessThanOrEqual(1);
    });

    it('HIT_RIPPLE_EXPAND_DURATION fits within HIT_IMPACT_DURATION', () => {
        expect(HIT_RIPPLE_EXPAND_DURATION).toBeGreaterThan(0);
        expect(HIT_RIPPLE_EXPAND_DURATION).toBeLessThanOrEqual(
            HIT_IMPACT_DURATION,
        );
    });

    it('HIT_RIPPLE_RING_WIDTH is positive and less than max radius', () => {
        expect(HIT_RIPPLE_RING_WIDTH).toBeGreaterThan(0);
        expect(HIT_RIPPLE_RING_WIDTH).toBeLessThan(HIT_RIPPLE_MAX_RADIUS);
    });
});
