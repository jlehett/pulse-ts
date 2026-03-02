import {
    PLATFORM_RADIUS,
    PLATFORM_HEIGHT,
    createGridNormalMap,
} from './PlatformNode';
import { ARENA_RADIUS } from '../config/arena';

jest.mock('three', () => ({
    DataTexture: jest.fn().mockImplementation((data, w, h) => ({
        data,
        width: w,
        height: h,
        wrapS: 0,
        wrapT: 0,
        needsUpdate: false,
    })),
    RGBFormat: 1028,
    RepeatWrapping: 1000,
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

    it('creates RGB data buffer of correct size', () => {
        const tex = createGridNormalMap(32, 8);
        expect(tex.data).toBeInstanceOf(Uint8Array);
        expect(tex.data.length).toBe(32 * 32 * 3);
    });

    it('sets flat normal at non-grid pixels', () => {
        const tex = createGridNormalMap(64, 32);
        // Pixel (1, 1) is not on a grid line
        const i = (1 * 64 + 1) * 3;
        expect(tex.data[i]).toBe(128); // nx
        expect(tex.data[i + 1]).toBe(128); // ny
        expect(tex.data[i + 2]).toBe(255); // nz
    });

    it('perturbs normals at grid-line pixels', () => {
        const tex = createGridNormalMap(64, 32);
        // Pixel (32, 1) is on a vertical grid line
        const i = (1 * 64 + 32) * 3;
        expect(tex.data[i]).toBe(96); // tilted nx
    });
});
