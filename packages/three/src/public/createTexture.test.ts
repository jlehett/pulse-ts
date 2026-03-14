/** @jest-environment jsdom */

// ---------------------------------------------------------------------------
// Lightweight Three.js mock — only what createTexture needs
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
    RepeatWrapping: 1000,
    ClampToEdgeWrapping: 1001,
    MirroredRepeatWrapping: 1002,
    LinearFilter: 1006,
    NearestFilter: 1003,
    RGBAFormat: 1023,
    RGBFormat: 1022,
}));

import { createTexture, createTexture1D } from './createTexture';

// ---------------------------------------------------------------------------
// createTexture (2D)
// ---------------------------------------------------------------------------
describe('createTexture', () => {
    it('creates a square DataTexture with correct buffer size', () => {
        const tex = createTexture(4, () => [255, 0, 0, 255]);
        const img = (
            tex as unknown as {
                image: { data: Uint8Array; width: number; height: number };
            }
        ).image;

        expect(img.width).toBe(4);
        expect(img.height).toBe(4);
        expect(img.data.length).toBe(4 * 4 * 4); // 4x4 pixels, 4 channels
    });

    it('writes pixel data from the rasterize callback', () => {
        const tex = createTexture(2, (x, y) => [x * 100, y * 100, 50, 200]);
        const data = (tex as unknown as { image: { data: Uint8Array } }).image
            .data;

        // pixel (0,0) => [0, 0, 50, 200]
        expect(data[0]).toBe(0);
        expect(data[1]).toBe(0);
        expect(data[2]).toBe(50);
        expect(data[3]).toBe(200);

        // pixel (1,0) => [100, 0, 50, 200]
        expect(data[4]).toBe(100);
        expect(data[5]).toBe(0);
        expect(data[6]).toBe(50);
        expect(data[7]).toBe(200);

        // pixel (0,1) => [0, 100, 50, 200]
        expect(data[8]).toBe(0);
        expect(data[9]).toBe(100);
        expect(data[10]).toBe(50);
        expect(data[11]).toBe(200);
    });

    it('passes size to the rasterize callback', () => {
        const sizes: number[] = [];
        createTexture(8, (_x, _y, size) => {
            sizes.push(size);
            return [0, 0, 0, 0];
        });
        expect(sizes.every((s) => s === 8)).toBe(true);
        expect(sizes.length).toBe(64);
    });

    it('sets needsUpdate to true', () => {
        const tex = createTexture(2, () => [0, 0, 0, 0]);
        expect(tex.needsUpdate).toBe(true);
    });

    it('defaults to repeat wrap and linear filter', () => {
        const tex = createTexture(2, () => [0, 0, 0, 0]);
        expect(tex.wrapS).toBe(1000); // RepeatWrapping
        expect(tex.wrapT).toBe(1000);
        expect(tex.minFilter).toBe(1006); // LinearFilter
        expect(tex.magFilter).toBe(1006);
    });

    it('maps clamp wrap mode', () => {
        const tex = createTexture(2, () => [0, 0, 0, 0], { wrap: 'clamp' });
        expect(tex.wrapS).toBe(1001); // ClampToEdgeWrapping
        expect(tex.wrapT).toBe(1001);
    });

    it('maps mirror wrap mode', () => {
        const tex = createTexture(2, () => [0, 0, 0, 0], { wrap: 'mirror' });
        expect(tex.wrapS).toBe(1002); // MirroredRepeatWrapping
        expect(tex.wrapT).toBe(1002);
    });

    it('maps nearest filter mode', () => {
        const tex = createTexture(2, () => [0, 0, 0, 0], { filter: 'nearest' });
        expect(tex.minFilter).toBe(1003); // NearestFilter
        expect(tex.magFilter).toBe(1003);
    });

    it('supports rgb format with 3 channels', () => {
        const tex = createTexture(2, () => [10, 20, 30, 255], {
            format: 'rgb',
        });
        const img = (tex as unknown as { image: { data: Uint8Array } }).image;

        expect(img.data.length).toBe(2 * 2 * 3); // 3 channels
        // pixel (0,0) => [10, 20, 30]
        expect(img.data[0]).toBe(10);
        expect(img.data[1]).toBe(20);
        expect(img.data[2]).toBe(30);
        // no alpha byte at index 3 — next pixel starts there
        expect(img.data[3]).toBe(10); // pixel (1,0) R
    });

    it('passes RGBFormat to DataTexture when format is rgb', () => {
        const tex = createTexture(2, () => [0, 0, 0, 0], { format: 'rgb' });
        expect((tex as unknown as { format: number }).format).toBe(1022); // RGBFormat
    });
});

// ---------------------------------------------------------------------------
// createTexture1D
// ---------------------------------------------------------------------------
describe('createTexture1D', () => {
    it('creates a 1-pixel-tall DataTexture', () => {
        const tex = createTexture1D(8, () => [0, 0, 0, 255]);
        const img = (
            tex as unknown as {
                image: { data: Uint8Array; width: number; height: number };
            }
        ).image;

        expect(img.width).toBe(8);
        expect(img.height).toBe(1);
        expect(img.data.length).toBe(8 * 4);
    });

    it('writes pixel data from the rasterize callback', () => {
        const tex = createTexture1D(4, (x, width) => [x * 50, width, 0, 255]);
        const data = (tex as unknown as { image: { data: Uint8Array } }).image
            .data;

        // pixel 0 => [0, 4, 0, 255]
        expect(data[0]).toBe(0);
        expect(data[1]).toBe(4);

        // pixel 2 => [100, 4, 0, 255]
        expect(data[8]).toBe(100);
        expect(data[9]).toBe(4);
    });

    it('sets needsUpdate to true', () => {
        const tex = createTexture1D(4, () => [0, 0, 0, 0]);
        expect(tex.needsUpdate).toBe(true);
    });

    it('applies wrap and filter options', () => {
        const tex = createTexture1D(4, () => [0, 0, 0, 0], {
            wrap: 'mirror',
            filter: 'nearest',
        });
        expect(tex.wrapS).toBe(1002);
        expect(tex.wrapT).toBe(1002);
        expect(tex.minFilter).toBe(1003);
        expect(tex.magFilter).toBe(1003);
    });

    it('supports rgb format', () => {
        const tex = createTexture1D(4, () => [10, 20, 30, 255], {
            format: 'rgb',
        });
        const data = (tex as unknown as { image: { data: Uint8Array } }).image
            .data;
        expect(data.length).toBe(4 * 3);
    });
});
