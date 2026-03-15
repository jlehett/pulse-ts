/** Resolution of the CPU-rasterized wake influence map (desktop). */
export const WAKE_MAP_SIZE = 64;

/** Resolution of the wake influence map on mobile (reduced for CPU savings). */
export const WAKE_MAP_SIZE_MOBILE = 32;

/** Maximum UV displacement applied by the wake effect (UV units). */
export const WAKE_DISPLACEMENT = 0.06;

/** Minimum world-space distance between trail samples to register a wake point. */
export const WAKE_MIN_DISTANCE = 0.05;

/** World-space radius of each wake splat at full expansion (units). */
export const WAKE_RADIUS = 4;

/** Fraction of WAKE_RADIUS used for fresh trail points (0..1). Grows to 1.0 as strength decays. */
export const WAKE_THIN_START = 0.25;

/** Seconds between trail point samples for the wake effect. */
export const WAKE_TRAIL_INTERVAL = 0.05;

/** Strength decay rate per second for trail points. */
export const WAKE_TRAIL_DECAY = 1.2;

/** Maximum number of trail points stored for the wake effect. */
export const WAKE_MAX_TRAIL = 80;

/**
 * Trail point used by the wake rasterizer.
 */
export interface WakeTrailPoint {
    /** World-space X position. */
    x: number;
    /** World-space Z position. */
    z: number;
    /** Intensity in 0..1 (1 = fresh, decays toward 0). */
    strength: number;
    /** Normalized movement direction X (world space). */
    dirX: number;
    /** Normalized movement direction Z (world space). */
    dirZ: number;
}

/**
 * Rasterize wake trail displacement into an RGBA `Uint8Array`.
 * Each trail point splats a 2D displacement vector perpendicular to the
 * player's movement direction, creating a boat-wake distortion that pushes
 * grid lines outward from the trail path.
 *
 * Encoding: R = 128 + du*127, G = 128 + dv*127, B = 0, A = 255.
 * 128 = no displacement; signed direction encoded around midpoint.
 *
 * @param data - RGBA pixel buffer (`size * size * 4` bytes). Cleared then filled.
 * @param size - Width and height of the texture in pixels.
 * @param trail - Array of trail points with world-space positions, strength, and direction.
 * @param arenaRadius - World-space radius of the arena (maps to texture extent).
 * @param wakeRadius - World-space radius of each wake splat.
 *
 * @example
 * ```ts
 * rasterizeWake(wakeMap.image.data, 64, trail, ARENA_RADIUS, WAKE_RADIUS);
 * wakeMap.needsUpdate = true;
 * ```
 */
export function rasterizeWake(
    data: Uint8Array,
    size: number,
    trail: readonly WakeTrailPoint[],
    arenaRadius: number,
    wakeRadius: number,
): void {
    const texelCount = size * size;

    // Initialize output: R=128, G=128, B=0, A=255 (no displacement)
    for (let i = 0; i < texelCount; i++) {
        const idx = i * 4;
        data[idx] = 128;
        data[idx + 1] = 128;
        data[idx + 2] = 0;
        data[idx + 3] = 255;
    }

    if (trail.length === 0) return;

    // Float32 scratch buffer for clean accumulation (2 floats per texel: du, dv)
    const scratch = new Float32Array(texelCount * 2);

    // Precompute base pixel radius
    const texelsPerUnit = size / (arenaRadius * 2);
    const maxSplatRadius = wakeRadius * texelsPerUnit;

    for (const pt of trail) {
        // Wake starts thin (WAKE_THIN_START fraction) and expands as
        // strength decays toward 0, reaching full radius at end of life.
        const widthFraction =
            WAKE_THIN_START + (1 - WAKE_THIN_START) * (1 - pt.strength);
        const splatRadius = maxSplatRadius * widthFraction;
        const splatRadiusSq = splatRadius * splatRadius;

        // World to texel: center of arena = (size/2, size/2).
        // Three.js CylinderGeometry cap UVs: u = (z/R+1)*0.5, v = (x/R+1)*0.5
        // so texel column (cx) maps from world Z, texel row (cy) from world X.
        const cx = (pt.z / arenaRadius + 1) * 0.5 * size;
        const cy = (pt.x / arenaRadius + 1) * 0.5 * size;

        // Movement direction mapped to texel space:
        // texel X proportional to world Z, texel Y proportional to world X
        const movTexX = pt.dirZ;
        const movTexY = pt.dirX;

        // Perpendicular to movement in texel space
        const perpTexX = -movTexY;
        const perpTexY = movTexX;

        const minX = Math.max(0, Math.floor(cx - splatRadius));
        const maxX = Math.min(size - 1, Math.ceil(cx + splatRadius));
        const minY = Math.max(0, Math.floor(cy - splatRadius));
        const maxY = Math.min(size - 1, Math.ceil(cy + splatRadius));

        for (let py = minY; py <= maxY; py++) {
            for (let px = minX; px <= maxX; px++) {
                const dx = px - cx;
                const dy = py - cy;
                const distSq = dx * dx + dy * dy;
                if (distSq >= splatRadiusSq) continue;

                const dist = Math.sqrt(distSq);
                if (dist < 0.001) continue;

                // Smoothstep radial falloff: 1 at center, 0 at edge
                const t = dist / splatRadius;
                const radialFalloff = 1 - t * t * (3 - 2 * t);

                // Signed perpendicular distance from the trail line.
                // Positive = one side, negative = other side.
                // Normalized by splatRadius so the factor stays in [-1, 1].
                const perpDot = dx * perpTexX + dy * perpTexY;
                const perpFactor = perpDot / splatRadius;

                // Displacement is perpendicular to movement, scaled by
                // how far off the trail line this texel is (perpFactor)
                // and the radial falloff. Zero ON the trail line, peaks
                // to the sides, then falls off at the splat edge.
                const mag = perpFactor * radialFalloff * pt.strength;
                const si = (py * size + px) * 2;
                scratch[si] += perpTexX * mag;
                scratch[si + 1] += perpTexY * mag;
            }
        }
    }

    // Encode accumulated displacement to RGBA uint8
    for (let i = 0; i < texelCount; i++) {
        const si = i * 2;
        const du = scratch[si];
        const dv = scratch[si + 1];
        const idx = i * 4;
        data[idx] = Math.min(255, Math.max(0, Math.round(128 + du * 127)));
        data[idx + 1] = Math.min(255, Math.max(0, Math.round(128 + dv * 127)));
    }
}

/**
 * Convert a world-space XZ position to UV coordinates matching
 * Three.js CylinderGeometry's top-cap UV layout.
 *
 * UV mapping: `u = (z / R + 1) * 0.5`, `v = (x / R + 1) * 0.5`.
 *
 * @param worldX - World-space X coordinate.
 * @param worldZ - World-space Z coordinate.
 * @param arenaRadius - Radius of the arena cylinder.
 * @returns `[u, v]` in 0–1 UV space.
 *
 * @example
 * ```ts
 * worldToUV(0, 0, 10); // [0.5, 0.5] — center
 * worldToUV(10, 0, 10); // [0.5, 1.0] — edge
 * ```
 */
export function worldToUV(
    worldX: number,
    worldZ: number,
    arenaRadius: number,
): [number, number] {
    const u = (worldZ / arenaRadius + 1) * 0.5;
    const v = (worldX / arenaRadius + 1) * 0.5;
    return [u, v];
}
