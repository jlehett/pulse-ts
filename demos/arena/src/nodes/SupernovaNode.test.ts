jest.mock(
    '@pulse-ts/core',
    () => ({
        useFrameUpdate: jest.fn(),
    }),
    { virtual: true },
);

jest.mock(
    '@pulse-ts/three',
    () => ({
        useObject3D: jest.fn(),
    }),
    { virtual: true },
);

jest.mock(
    '@pulse-ts/effects',
    () => ({
        useEffectPool: jest.fn().mockReturnValue({
            trigger: jest.fn(),
            active: () => [],
            hasActive: false,
            reset: jest.fn(),
        }),
    }),
    { virtual: true },
);

jest.mock('three', () => {
    const actual = jest.requireActual('three');
    return {
        ...actual,
        CanvasTexture: jest.fn().mockImplementation(() => ({})),
    };
});

import {
    SupernovaNode,
    createSupernovaTexture,
    randomSpherePoint,
    SUPERNOVA_POOL_SIZE,
    SUPERNOVA_INTERVAL_MIN,
    SUPERNOVA_INTERVAL_MAX,
    SUPERNOVA_RADIUS_MIN,
    SUPERNOVA_RADIUS_MAX,
    SUPERNOVA_LIFETIME,
    SUPERNOVA_SCALE_START,
    SUPERNOVA_SCALE_END,
    SUPERNOVA_TEXTURE_SIZE,
    SUPERNOVA_SHAPE_EXP,
    SUPERNOVA_COLOR_BOOST,
    SUPERNOVA_RAY_COUNT,
    SUPERNOVA_RAY_SHARPNESS,
    SUPERNOVA_CORONA_SPIN,
} from './SupernovaNode';

describe('SupernovaNode', () => {
    it('is a function', () => {
        expect(typeof SupernovaNode).toBe('function');
    });
});

describe('SupernovaNode constants', () => {
    it('SUPERNOVA_POOL_SIZE is positive', () => {
        expect(SUPERNOVA_POOL_SIZE).toBeGreaterThan(0);
    });

    it('SUPERNOVA_INTERVAL_MIN is positive', () => {
        expect(SUPERNOVA_INTERVAL_MIN).toBeGreaterThan(0);
    });

    it('SUPERNOVA_INTERVAL_MAX is greater than SUPERNOVA_INTERVAL_MIN', () => {
        expect(SUPERNOVA_INTERVAL_MAX).toBeGreaterThan(SUPERNOVA_INTERVAL_MIN);
    });

    it('SUPERNOVA_RADIUS_MIN is positive', () => {
        expect(SUPERNOVA_RADIUS_MIN).toBeGreaterThan(0);
    });

    it('SUPERNOVA_RADIUS_MAX is greater than SUPERNOVA_RADIUS_MIN', () => {
        expect(SUPERNOVA_RADIUS_MAX).toBeGreaterThan(SUPERNOVA_RADIUS_MIN);
    });

    it('SUPERNOVA_LIFETIME is positive', () => {
        expect(SUPERNOVA_LIFETIME).toBeGreaterThan(0);
    });

    it('SUPERNOVA_SCALE_END is greater than SUPERNOVA_SCALE_START', () => {
        expect(SUPERNOVA_SCALE_END).toBeGreaterThan(SUPERNOVA_SCALE_START);
    });

    it('SUPERNOVA_SCALE_START is positive', () => {
        expect(SUPERNOVA_SCALE_START).toBeGreaterThan(0);
    });

    it('SUPERNOVA_TEXTURE_SIZE is a power of two', () => {
        expect(SUPERNOVA_TEXTURE_SIZE).toBeGreaterThan(0);
        expect(SUPERNOVA_TEXTURE_SIZE & (SUPERNOVA_TEXTURE_SIZE - 1)).toBe(0);
    });

    it('SUPERNOVA_SHAPE_EXP is between 1 and 2 for a lemon shape', () => {
        expect(SUPERNOVA_SHAPE_EXP).toBeGreaterThan(1);
        expect(SUPERNOVA_SHAPE_EXP).toBeLessThan(2);
    });

    it('SUPERNOVA_COLOR_BOOST is greater than 1 for HDR bloom', () => {
        expect(SUPERNOVA_COLOR_BOOST).toBeGreaterThan(1);
    });

    it('SUPERNOVA_RAY_COUNT is at least 3', () => {
        expect(SUPERNOVA_RAY_COUNT).toBeGreaterThanOrEqual(3);
    });

    it('SUPERNOVA_RAY_SHARPNESS is positive', () => {
        expect(SUPERNOVA_RAY_SHARPNESS).toBeGreaterThan(0);
    });

    it('SUPERNOVA_CORONA_SPIN is positive', () => {
        expect(SUPERNOVA_CORONA_SPIN).toBeGreaterThan(0);
    });
});

describe('randomSpherePoint', () => {
    it('returns vectors within radius bounds', () => {
        const rMin = 10;
        const rMax = 30;
        for (let i = 0; i < 200; i++) {
            const v = randomSpherePoint(rMin, rMax);
            const r = v.length();
            expect(r).toBeGreaterThanOrEqual(rMin - 0.01);
            expect(r).toBeLessThanOrEqual(rMax + 0.01);
        }
    });

    it('covers both hemispheres', () => {
        let hasPositiveY = false;
        let hasNegativeY = false;
        for (let i = 0; i < 500; i++) {
            const v = randomSpherePoint(10, 20);
            if (v.y > 0) hasPositiveY = true;
            if (v.y < 0) hasNegativeY = true;
        }
        expect(hasPositiveY).toBe(true);
        expect(hasNegativeY).toBe(true);
    });
});

describe('createSupernovaTexture', () => {
    it('creates a canvas and writes blurred pixel data via putImageData', () => {
        const size = 32; // small for speed
        const mockImageData = {
            data: new Uint8ClampedArray(size * size * 4),
        };
        const putImageData = jest.fn();
        const createImageData = jest.fn().mockReturnValue(mockImageData);

        const mockCtx = { createImageData, putImageData };

        const mockCanvas = {
            width: 0,
            height: 0,
            getContext: jest.fn().mockReturnValue(mockCtx),
        };

        const origCreateElement = document.createElement.bind(document);
        jest.spyOn(document, 'createElement').mockImplementation((tag) => {
            if (tag === 'canvas')
                return mockCanvas as unknown as HTMLCanvasElement;
            return origCreateElement(tag);
        });

        try {
            createSupernovaTexture(size);

            expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
            expect(createImageData).toHaveBeenCalledWith(size, size);
            expect(putImageData).toHaveBeenCalledWith(mockImageData, 0, 0);
        } finally {
            (document.createElement as jest.Mock).mockRestore();
        }
    });
});
