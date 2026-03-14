import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Per-pixel rasterization callback. Returns `[R, G, B, A]` (0–255). */
export type PixelFn = (
    x: number,
    y: number,
    size: number,
) => [number, number, number, number];

/** Per-pixel rasterization callback for 1D textures. Returns `[R, G, B, A]` (0–255). */
export type PixelFn1D = (
    x: number,
    width: number,
) => [number, number, number, number];

/** Options for procedural texture creation. */
export interface TextureOptions {
    /**
     * Wrap mode applied to both axes.
     * @default 'repeat'
     */
    wrap?: 'repeat' | 'clamp' | 'mirror';
    /**
     * Texture filtering mode applied to both min and mag filters.
     * @default 'linear'
     */
    filter?: 'linear' | 'nearest';
    /**
     * Pixel format.
     * @default 'rgba'
     */
    format?: 'rgba' | 'rgb';
}

// ---------------------------------------------------------------------------
// Enum mappings
// ---------------------------------------------------------------------------

const WRAP_MAP: Record<NonNullable<TextureOptions['wrap']>, THREE.Wrapping> = {
    repeat: THREE.RepeatWrapping,
    clamp: THREE.ClampToEdgeWrapping,
    mirror: THREE.MirroredRepeatWrapping,
};

const FILTER_MAP: Record<
    NonNullable<TextureOptions['filter']>,
    THREE.TextureFilter
> = {
    linear: THREE.LinearFilter,
    nearest: THREE.NearestFilter,
};

const FORMAT_MAP: Record<
    NonNullable<TextureOptions['format']>,
    THREE.PixelFormat
> = {
    rgba: THREE.RGBAFormat,
    rgb: THREE.RGBFormat,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function channelsFor(format: NonNullable<TextureOptions['format']>): number {
    return format === 'rgb' ? 3 : 4;
}

function applyOptions(
    texture: THREE.DataTexture,
    options: TextureOptions,
): void {
    const wrap = options.wrap ?? 'repeat';
    const filter = options.filter ?? 'linear';

    texture.wrapS = WRAP_MAP[wrap];
    texture.wrapT = WRAP_MAP[wrap];
    texture.minFilter = FILTER_MAP[filter];
    texture.magFilter = FILTER_MAP[filter];
    texture.needsUpdate = true;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a procedural square `DataTexture` by rasterizing a per-pixel function.
 * Handles buffer allocation, DataTexture creation, and filter/wrap setup.
 *
 * @param size - Texture width and height in pixels (square).
 * @param rasterize - Called for each pixel; returns `[R, G, B, A]` (0–255).
 * @param options - Wrap mode, filter mode, and format.
 * @returns A ready-to-use `DataTexture` with `needsUpdate` already set.
 *
 * @example
 * ```ts
 * const normalMap = createTexture(256, (x, y, size) => {
 *     const cx = (x / size - 0.5) * 2;
 *     const cy = (y / size - 0.5) * 2;
 *     return [cx * 127 + 128, cy * 127 + 128, 255, 255];
 * }, { wrap: 'repeat', filter: 'linear' });
 * ```
 *
 * @example
 * ```ts
 * const emissiveMap = createTexture(256, (x, y, size) => {
 *     const spacing = 32;
 *     const onLine = x % spacing <= 1 || y % spacing <= 1;
 *     return onLine ? [50, 180, 220, 255] : [0, 0, 0, 255];
 * }, { wrap: 'repeat', filter: 'linear' });
 * ```
 */
export function createTexture(
    size: number,
    rasterize: PixelFn,
    options: TextureOptions = {},
): THREE.DataTexture {
    const fmt = options.format ?? 'rgba';
    const channels = channelsFor(fmt);
    const data = new Uint8Array(size * size * channels);

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const pixel = rasterize(x, y, size);
            const i = (y * size + x) * channels;
            data[i] = pixel[0];
            data[i + 1] = pixel[1];
            data[i + 2] = pixel[2];
            if (channels === 4) {
                data[i + 3] = pixel[3];
            }
        }
    }

    const texture = new THREE.DataTexture(data, size, size, FORMAT_MAP[fmt]);
    applyOptions(texture, options);
    return texture;
}

/**
 * Create a 1D procedural `DataTexture` (height = 1) by rasterizing a per-pixel function.
 * Useful for gradient textures and color ramps.
 *
 * @param width - Texture width in pixels.
 * @param rasterize - Called for each pixel; returns `[R, G, B, A]` (0–255).
 * @param options - Wrap mode, filter mode, and format.
 * @returns A 1-pixel-tall `DataTexture` with `needsUpdate` already set.
 *
 * @example
 * ```ts
 * const gradient = createTexture1D(64, (x, width) => {
 *     const t = x / width;
 *     return [255 * t, 100, 255 * (1 - t), 255];
 * });
 * ```
 */
export function createTexture1D(
    width: number,
    rasterize: PixelFn1D,
    options: TextureOptions = {},
): THREE.DataTexture {
    const fmt = options.format ?? 'rgba';
    const channels = channelsFor(fmt);
    const data = new Uint8Array(width * channels);

    for (let x = 0; x < width; x++) {
        const pixel = rasterize(x, width);
        const i = x * channels;
        data[i] = pixel[0];
        data[i + 1] = pixel[1];
        data[i + 2] = pixel[2];
        if (channels === 4) {
            data[i + 3] = pixel[3];
        }
    }

    const texture = new THREE.DataTexture(data, width, 1, FORMAT_MAP[fmt]);
    applyOptions(texture, options);
    return texture;
}
