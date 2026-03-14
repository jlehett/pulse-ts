/** @jest-environment jsdom */
import { createTexture, createTexture1D } from './createTexture';

// ---------------------------------------------------------------------------
// Three.js mock — DataTexture and format constants
// ---------------------------------------------------------------------------
jest.mock('three', () => ({
    DataTexture: jest.fn().mockImplementation(function (
        this: Record<string, unknown>,
        data: Uint8Array,
        width: number,
        height: number,
        format: number,
    ) {
        this.image = { data, width, height };
        this.format = format;
        this.wrapS = 0;
        this.wrapT = 0;
        this.minFilter = 0;
        this.magFilter = 0;
        this.needsUpdate = false;
    }),
    RGBAFormat: 1023,
    RGBFormat: 1022,
    RepeatWrapping: 1000,
    ClampToEdgeWrapping: 1001,
    MirroredRepeatWrapping: 1002,
    LinearFilter: 1006,
    NearestFilter: 1003,
}));

// ---------------------------------------------------------------------------
// createTexture
// ---------------------------------------------------------------------------
describe('createTexture', () => {
    it('creates a square RGBA DataTexture with correct buffer size', () => {
        const tex = createTexture(4, (x, y) => [
            x * 10,
            y * 10,
            128,
            255,
        ]) as unknown as Record<string, unknown>;
        const img = tex.image as {
            data: Uint8Array;
            width: number;
            height: number;
        };

        expect(img.width).toBe(4);
        expect(img.height).toBe(4);
        expect(img.data.length).toBe(4 * 4 * 4); // 4×4 pixels × 4 channels
    });

    it('populates pixel data from the rasterize callback', () => {
        const tex = createTexture(2, (x, y) => [
            x * 100,
            y * 100,
            50,
            200,
        ]) as unknown as Record<string, unknown>;
        const data = (tex.image as { data: Uint8Array }).data;

        // Pixel (0,0): [0, 0, 50, 200]
        expect(data[0]).toBe(0);
        expect(data[1]).toBe(0);
        expect(data[2]).toBe(50);
        expect(data[3]).toBe(200);

        // Pixel (1,0): [100, 0, 50, 200]
        expect(data[4]).toBe(100);
        expect(data[5]).toBe(0);
        expect(data[6]).toBe(50);
        expect(data[7]).toBe(200);

        // Pixel (0,1): [0, 100, 50, 200]
        expect(data[8]).toBe(0);
        expect(data[9]).toBe(100);
        expect(data[10]).toBe(50);
        expect(data[11]).toBe(200);
    });

    it('sets needsUpdate to true', () => {
        const tex = createTexture(2, () => [0, 0, 0, 255]) as unknown as Record<
            string,
            unknown
        >;
        expect(tex.needsUpdate).toBe(true);
    });

    it('applies default wrap (clamp) and filter (linear)', () => {
        const tex = createTexture(2, () => [0, 0, 0, 255]) as unknown as Record<
            string,
            unknown
        >;
        expect(tex.wrapS).toBe(1001); // ClampToEdgeWrapping
        expect(tex.wrapT).toBe(1001);
        expect(tex.minFilter).toBe(1006); // LinearFilter
        expect(tex.magFilter).toBe(1006);
    });

    it('maps wrap "repeat" to RepeatWrapping', () => {
        const tex = createTexture(2, () => [0, 0, 0, 255], {
            wrap: 'repeat',
        }) as unknown as Record<string, unknown>;
        expect(tex.wrapS).toBe(1000);
        expect(tex.wrapT).toBe(1000);
    });

    it('maps wrap "mirror" to MirroredRepeatWrapping', () => {
        const tex = createTexture(2, () => [0, 0, 0, 255], {
            wrap: 'mirror',
        }) as unknown as Record<string, unknown>;
        expect(tex.wrapS).toBe(1002);
        expect(tex.wrapT).toBe(1002);
    });

    it('maps filter "nearest" to NearestFilter', () => {
        const tex = createTexture(2, () => [0, 0, 0, 255], {
            filter: 'nearest',
        }) as unknown as Record<string, unknown>;
        expect(tex.minFilter).toBe(1003);
        expect(tex.magFilter).toBe(1003);
    });

    it('supports RGB format with 3-channel buffer', () => {
        const tex = createTexture(2, () => [10, 20, 30, 255], {
            format: 'rgb',
        }) as unknown as Record<string, unknown>;
        const img = tex.image as { data: Uint8Array };
        expect(img.data.length).toBe(2 * 2 * 3); // 3 channels
        // Alpha channel should not be written
        expect(img.data[0]).toBe(10);
        expect(img.data[1]).toBe(20);
        expect(img.data[2]).toBe(30);
        expect(tex.format).toBe(1022); // RGBFormat
    });

    it('passes size parameter to the rasterize callback', () => {
        const rasterize = jest.fn().mockReturnValue([0, 0, 0, 255]);
        createTexture(3, rasterize);
        // Should be called 9 times (3×3)
        expect(rasterize).toHaveBeenCalledTimes(9);
        // First call should receive (0, 0, 3)
        expect(rasterize).toHaveBeenCalledWith(0, 0, 3);
        // Last call should receive (2, 2, 3)
        expect(rasterize).toHaveBeenCalledWith(2, 2, 3);
    });
});

// ---------------------------------------------------------------------------
// createTexture1D
// ---------------------------------------------------------------------------
describe('createTexture1D', () => {
    it('creates a 1-pixel-tall DataTexture', () => {
        const tex = createTexture1D(8, (x) => [
            x * 30,
            0,
            0,
            255,
        ]) as unknown as Record<string, unknown>;
        const img = tex.image as {
            data: Uint8Array;
            width: number;
            height: number;
        };
        expect(img.width).toBe(8);
        expect(img.height).toBe(1);
        expect(img.data.length).toBe(8 * 4);
    });

    it('populates pixel data correctly', () => {
        const tex = createTexture1D(3, (x, width) => [
            x * 100,
            width,
            50,
            200,
        ]) as unknown as Record<string, unknown>;
        const data = (tex.image as { data: Uint8Array }).data;

        // Pixel 0: [0, 3, 50, 200]
        expect(data[0]).toBe(0);
        expect(data[1]).toBe(3);
        expect(data[2]).toBe(50);
        expect(data[3]).toBe(200);

        // Pixel 2: [200, 3, 50, 200]
        expect(data[8]).toBe(200);
        expect(data[9]).toBe(3);
    });

    it('sets needsUpdate to true', () => {
        const tex = createTexture1D(4, () => [
            0, 0, 0, 255,
        ]) as unknown as Record<string, unknown>;
        expect(tex.needsUpdate).toBe(true);
    });

    it('applies wrap and filter options', () => {
        const tex = createTexture1D(4, () => [0, 0, 0, 255], {
            wrap: 'repeat',
            filter: 'nearest',
        }) as unknown as Record<string, unknown>;
        expect(tex.wrapS).toBe(1000);
        expect(tex.wrapT).toBe(1000);
        expect(tex.minFilter).toBe(1003);
        expect(tex.magFilter).toBe(1003);
    });

    it('supports RGB format', () => {
        const tex = createTexture1D(4, () => [10, 20, 30, 255], {
            format: 'rgb',
        }) as unknown as Record<string, unknown>;
        const img = tex.image as { data: Uint8Array };
        expect(img.data.length).toBe(4 * 3);
        expect(tex.format).toBe(1022);
    });

    it('passes width parameter to the rasterize callback', () => {
        const rasterize = jest.fn().mockReturnValue([0, 0, 0, 255]);
        createTexture1D(5, rasterize);
        expect(rasterize).toHaveBeenCalledTimes(5);
        expect(rasterize).toHaveBeenCalledWith(0, 5);
        expect(rasterize).toHaveBeenCalledWith(4, 5);
    });
});
