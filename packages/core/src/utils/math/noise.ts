// Simplex noise implementation based on the algorithm by Stefan Gustavson.
// Pure functions, no state, no dependencies.

// --- Lookup tables ---

/** Gradient vectors for 2D simplex noise. */
const GRAD2: ReadonlyArray<readonly [number, number]> = [
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
];

/** Gradient vectors for 3D simplex noise. */
const GRAD3: ReadonlyArray<readonly [number, number, number]> = [
    [1, 1, 0],
    [-1, 1, 0],
    [1, -1, 0],
    [-1, -1, 0],
    [1, 0, 1],
    [-1, 0, 1],
    [1, 0, -1],
    [-1, 0, -1],
    [0, 1, 1],
    [0, -1, 1],
    [0, 1, -1],
    [0, -1, -1],
];

/** Permutation table (doubled to avoid wrapping). */
const PERM: readonly number[] = (() => {
    // prettier-ignore
    const p = [
        151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,
        140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,
        247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,
        57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,
        74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,
        60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,
        65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,
        200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,
        52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,
        207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,
        119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,
        129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,
        218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,
        81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,
        184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,
        222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180,
    ];
    const perm = new Array<number>(512);
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255]!;
    return perm;
})();

// --- Constants ---

const F2 = 0.5 * (Math.sqrt(3) - 1); // skew factor for 2D
const G2 = (3 - Math.sqrt(3)) / 6; // unskew factor for 2D
const F3 = 1 / 3; // skew factor for 3D
const G3 = 1 / 6; // unskew factor for 3D

// --- Helpers ---

function dot2(g: readonly [number, number], x: number, y: number): number {
    return g[0] * x + g[1] * y;
}

function dot3(
    g: readonly [number, number, number],
    x: number,
    y: number,
    z: number,
): number {
    return g[0] * x + g[1] * y + g[2] * z;
}

// --- Public API ---

/**
 * 2D simplex noise returning a value in [-1, 1].
 *
 * Pure function — same inputs always produce the same output.
 *
 * @param x - X coordinate.
 * @param y - Y coordinate.
 * @returns Noise value in [-1, 1].
 *
 * @example
 * ```ts
 * import { noise2D } from '@pulse-ts/core';
 *
 * const n = noise2D(x * 0.1, y * 0.1); // scale down for smoother noise
 * ```
 */
export function noise2D(x: number, y: number): number {
    // Skew input space to determine simplex cell
    const s = (x + y) * F2;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);

    // Unskew back to (x, y) space
    const t = (i + j) * G2;
    const x0 = x - (i - t);
    const y0 = y - (j - t);

    // Determine which simplex triangle we're in
    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;

    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;

    // Hash coordinates of the three simplex corners
    const ii = i & 255;
    const jj = j & 255;
    const gi0 = PERM[ii + PERM[jj]!]! % 8;
    const gi1 = PERM[ii + i1 + PERM[jj + j1]!]! % 8;
    const gi2 = PERM[ii + 1 + PERM[jj + 1]!]! % 8;

    // Calculate contributions from the three corners
    let n0 = 0;
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) {
        t0 *= t0;
        n0 = t0 * t0 * dot2(GRAD2[gi0]!, x0, y0);
    }

    let n1 = 0;
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) {
        t1 *= t1;
        n1 = t1 * t1 * dot2(GRAD2[gi1]!, x1, y1);
    }

    let n2 = 0;
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) {
        t2 *= t2;
        n2 = t2 * t2 * dot2(GRAD2[gi2]!, x2, y2);
    }

    // Scale to [-1, 1]
    return 70 * (n0 + n1 + n2);
}

/**
 * 3D simplex noise returning a value in [-1, 1].
 *
 * Pure function — same inputs always produce the same output.
 *
 * @param x - X coordinate.
 * @param y - Y coordinate.
 * @param z - Z coordinate.
 * @returns Noise value in [-1, 1].
 *
 * @example
 * ```ts
 * import { noise3D } from '@pulse-ts/core';
 *
 * // Animated 2D noise using time as 3rd dimension
 * const n = noise3D(x, y, time);
 * ```
 */
export function noise3D(x: number, y: number, z: number): number {
    // Skew input space
    const s = (x + y + z) * F3;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const k = Math.floor(z + s);

    // Unskew
    const t = (i + j + k) * G3;
    const x0 = x - (i - t);
    const y0 = y - (j - t);
    const z0 = z - (k - t);

    // Determine which simplex tetrahedron we're in
    let i1: number, j1: number, k1: number;
    let i2: number, j2: number, k2: number;

    if (x0 >= y0) {
        if (y0 >= z0) {
            i1 = 1;
            j1 = 0;
            k1 = 0;
            i2 = 1;
            j2 = 1;
            k2 = 0;
        } else if (x0 >= z0) {
            i1 = 1;
            j1 = 0;
            k1 = 0;
            i2 = 1;
            j2 = 0;
            k2 = 1;
        } else {
            i1 = 0;
            j1 = 0;
            k1 = 1;
            i2 = 1;
            j2 = 0;
            k2 = 1;
        }
    } else {
        if (y0 < z0) {
            i1 = 0;
            j1 = 0;
            k1 = 1;
            i2 = 0;
            j2 = 1;
            k2 = 1;
        } else if (x0 < z0) {
            i1 = 0;
            j1 = 1;
            k1 = 0;
            i2 = 0;
            j2 = 1;
            k2 = 1;
        } else {
            i1 = 0;
            j1 = 1;
            k1 = 0;
            i2 = 1;
            j2 = 1;
            k2 = 0;
        }
    }

    const x1 = x0 - i1 + G3;
    const y1 = y0 - j1 + G3;
    const z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2 * G3;
    const y2 = y0 - j2 + 2 * G3;
    const z2 = z0 - k2 + 2 * G3;
    const x3 = x0 - 1 + 3 * G3;
    const y3 = y0 - 1 + 3 * G3;
    const z3 = z0 - 1 + 3 * G3;

    // Hash coordinates of the four simplex corners
    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;
    const gi0 = PERM[ii + PERM[jj + PERM[kk]!]!]! % 12;
    const gi1 = PERM[ii + i1 + PERM[jj + j1 + PERM[kk + k1]!]!]! % 12;
    const gi2 = PERM[ii + i2 + PERM[jj + j2 + PERM[kk + k2]!]!]! % 12;
    const gi3 = PERM[ii + 1 + PERM[jj + 1 + PERM[kk + 1]!]!]! % 12;

    // Calculate contributions from the four corners
    let n0 = 0;
    let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if (t0 >= 0) {
        t0 *= t0;
        n0 = t0 * t0 * dot3(GRAD3[gi0]!, x0, y0, z0);
    }

    let n1 = 0;
    let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (t1 >= 0) {
        t1 *= t1;
        n1 = t1 * t1 * dot3(GRAD3[gi1]!, x1, y1, z1);
    }

    let n2 = 0;
    let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (t2 >= 0) {
        t2 *= t2;
        n2 = t2 * t2 * dot3(GRAD3[gi2]!, x2, y2, z2);
    }

    let n3 = 0;
    let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (t3 >= 0) {
        t3 *= t3;
        n3 = t3 * t3 * dot3(GRAD3[gi3]!, x3, y3, z3);
    }

    // Scale to [-1, 1]
    return 32 * (n0 + n1 + n2 + n3);
}

/**
 * Options for {@link fbm2D}.
 */
export interface FbmOptions {
    /** Number of noise layers (default: 4). */
    octaves?: number;
    /** Amplitude multiplier per octave (default: 0.5). */
    persistence?: number;
    /** Frequency multiplier per octave (default: 2.0). */
    lacunarity?: number;
}

/**
 * Fractional Brownian motion — layered 2D simplex noise.
 *
 * Each octave doubles frequency (by `lacunarity`) and reduces amplitude
 * (by `persistence`), producing natural-looking detail at multiple scales.
 *
 * @param x - X coordinate.
 * @param y - Y coordinate.
 * @param options - Octave count, persistence, and lacunarity.
 * @returns Noise value (range depends on octaves and persistence).
 *
 * @example
 * ```ts
 * import { fbm2D } from '@pulse-ts/core';
 *
 * const terrain = fbm2D(x * 0.02, y * 0.02, { octaves: 6, persistence: 0.5 });
 * ```
 */
export function fbm2D(x: number, y: number, options?: FbmOptions): number {
    const octaves = options?.octaves ?? 4;
    const persistence = options?.persistence ?? 0.5;
    const lacunarity = options?.lacunarity ?? 2.0;

    let value = 0;
    let amplitude = 1;
    let frequency = 1;

    for (let i = 0; i < octaves; i++) {
        value += amplitude * noise2D(x * frequency, y * frequency);
        amplitude *= persistence;
        frequency *= lacunarity;
    }

    return value;
}

/**
 * Options for {@link curlNoise2D}.
 */
export interface CurlNoiseOptions {
    /** Step size for finite differences (default: 0.01). */
    epsilon?: number;
    /** Frequency scale applied to coordinates (default: 1.0). */
    scale?: number;
}

/**
 * Curl noise — divergence-free 2D vector field derived from scalar noise.
 *
 * Computes the curl of a 2D scalar noise field using finite differences,
 * producing a displacement vector that naturally avoids convergence and
 * divergence. Useful for particle drift, atmospheric effects, and organic
 * motion patterns.
 *
 * @param x - X coordinate.
 * @param z - Z coordinate.
 * @param options - Epsilon for finite differences and scale factor.
 * @returns `[dx, dz]` displacement vector.
 *
 * @example
 * ```ts
 * import { curlNoise2D } from '@pulse-ts/core';
 *
 * const [curlX, curlZ] = curlNoise2D(px, pz, { epsilon: 0.5, scale: 0.3 });
 * particle.x += curlX * dt;
 * particle.z += curlZ * dt;
 * ```
 */
export function curlNoise2D(
    x: number,
    z: number,
    options?: CurlNoiseOptions,
): [number, number] {
    const epsilon = options?.epsilon ?? 0.01;
    const scale = options?.scale ?? 1.0;

    const sx = x * scale;
    const sz = z * scale;

    // Curl of a 2D scalar field N(x,z):
    //   curl_x =  dN/dz  (partial derivative w.r.t. z)
    //   curl_z = -dN/dx  (partial derivative w.r.t. x)
    const dx =
        (noise2D(sx, sz + epsilon) - noise2D(sx, sz - epsilon)) / (2 * epsilon);
    const dz =
        -(noise2D(sx + epsilon, sz) - noise2D(sx - epsilon, sz)) /
        (2 * epsilon);

    return [dx, dz];
}
