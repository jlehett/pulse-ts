/**
 * Mutable 3-component vector used for particle position and velocity.
 *
 * Provides chainable convenience methods for common particle setup patterns.
 */
export interface Vec3Mut {
    x: number;
    y: number;
    z: number;

    /**
     * Set all three components.
     *
     * @param x - X component.
     * @param y - Y component.
     * @param z - Z component.
     * @returns `this` for chaining.
     */
    set(x: number, y: number, z: number): Vec3Mut;

    /**
     * Set to a uniformly distributed random unit direction (spherical).
     *
     * @returns `this` for chaining.
     */
    randomDirection(): Vec3Mut;

    /**
     * Multiply all components by a scalar.
     *
     * @param s - Scale factor.
     * @returns `this` for chaining.
     */
    scale(s: number): Vec3Mut;
}

/**
 * Mutable RGB color used for per-particle tinting.
 *
 * Components are in the 0–1 range for Three.js compatibility.
 */
export interface ColorMut {
    r: number;
    g: number;
    b: number;

    /**
     * Set from a hex integer (e.g. `0xff0000` for red).
     *
     * @param hex - 24-bit RGB integer.
     */
    set(hex: number): void;
}

/**
 * Per-particle state exposed to `init` and `update` callbacks.
 *
 * All fields are mutable — callbacks are expected to modify them freely.
 */
export interface Particle {
    /** Position in the emitter's local space. */
    readonly position: Vec3Mut;
    /** Velocity in units/second. Auto-integrated each tick before `update`. */
    readonly velocity: Vec3Mut;
    /** RGB color (0–1 range per channel). */
    readonly color: ColorMut;
    /** Opacity 0–1. */
    opacity: number;
    /** Point size in world units. */
    size: number;
    /** Seconds since this particle was spawned. */
    age: number;
    /** Seconds before this particle is automatically despawned. */
    lifetime: number;
    /** Whether this particle is currently alive. */
    alive: boolean;
    /** Arbitrary per-particle storage for user data. */
    userData: Record<string, unknown>;
}

/** Tuple type for 3D world-space positions. */
export type Point3 = [number, number, number];

/**
 * Callback invoked once for each newly spawned particle.
 *
 * Set velocity, color, lifetime, size, and any userData here.
 *
 * @param p - The particle to initialize.
 */
export type InitFn = (p: Particle) => void;

/**
 * Callback invoked every tick for each alive particle (after velocity
 * auto-integration).
 *
 * Apply forces, fade opacity, update size, etc.
 *
 * @param p  - The particle to update.
 * @param dt - Delta time in seconds since the last tick.
 */
export type UpdateFn = (p: Particle, dt: number) => void;

/**
 * Configuration for {@link ParticlePool}.
 */
export interface ParticlePoolOptions {
    /** Maximum number of particles that can be alive simultaneously. */
    maxCount: number;
    /** Called once per newly spawned particle. */
    init?: InitFn;
    /** Called every tick for each alive particle (after velocity integration). */
    update?: UpdateFn;
}

/**
 * Fixed-capacity particle pool with callback-driven init/update.
 *
 * Pre-allocates all particles up front. Dead particles are recycled in-place
 * to avoid GC pressure. Velocity is auto-integrated before the user update
 * callback each tick.
 *
 * @example
 * ```ts
 * const pool = new ParticlePool({
 *     maxCount: 100,
 *     init: (p) => {
 *         p.lifetime = 0.6;
 *         p.velocity.randomDirection().scale(4);
 *         p.color.set(0xf4d03f);
 *     },
 *     update: (p, dt) => {
 *         p.velocity.y -= 9.8 * dt;
 *         p.opacity = 1 - p.age / p.lifetime;
 *     },
 * });
 *
 * pool.burst(20, [1, 2, 0]);
 * pool.tick(0.016);
 * ```
 */
export class ParticlePool {
    /** Maximum number of particles. */
    readonly maxCount: number;

    /** The full particle array (alive + dead). */
    readonly particles: readonly Particle[];

    /** Called once per newly spawned particle. */
    init?: InitFn;

    /** Called every tick for each alive particle. */
    update?: UpdateFn;

    /** Continuous emission rate in particles/second. 0 = off. */
    rate = 0;

    /** Whether continuous emission is active. */
    emitting = false;

    /** Fractional particle accumulator for smooth continuous emission. */
    private _accumulator = 0;

    /** Internal mutable particles array. */
    private readonly _particles: Particle[];

    constructor(options: Readonly<ParticlePoolOptions>) {
        this.maxCount = options.maxCount;
        this.init = options.init;
        this.update = options.update;

        this._particles = [];
        for (let i = 0; i < options.maxCount; i++) {
            this._particles.push(createParticle());
        }
        this.particles = this._particles;
    }

    /** Number of currently alive particles. */
    get aliveCount(): number {
        let n = 0;
        for (let i = 0; i < this._particles.length; i++) {
            if (this._particles[i].alive) n++;
        }
        return n;
    }

    /**
     * Spawn a burst of particles.
     *
     * Each spawned particle is reset, optionally positioned at `position`,
     * and passed to the `init` callback (or `initOverride` if provided).
     * Skips already-alive particles; stops when `count` are spawned or the
     * pool is full.
     *
     * @param count        - Number of particles to spawn.
     * @param position     - Optional world-space origin for the burst.
     * @param initOverride - Optional per-burst init callback (overrides the
     *                       pool-level `init` for this burst only).
     */
    burst(count: number, position?: Point3, initOverride?: InitFn): void {
        const initFn = initOverride ?? this.init;
        let spawned = 0;
        for (let i = 0; i < this._particles.length && spawned < count; i++) {
            const p = this._particles[i];
            if (p.alive) continue;

            resetParticle(p);
            if (position) {
                p.position.x = position[0];
                p.position.y = position[1];
                p.position.z = position[2];
            }
            initFn?.(p);
            p.alive = true;
            spawned++;
        }
    }

    /**
     * Advance the simulation by `dt` seconds.
     *
     * 1. Continuous emission (if `emitting && rate > 0`).
     * 2. For each alive particle: age, auto-despawn, velocity integration,
     *    user `update` callback.
     *
     * @param dt - Delta time in seconds.
     */
    tick(dt: number): void {
        // Continuous emission
        if (this.emitting && this.rate > 0) {
            this._accumulator += this.rate * dt;
            const toSpawn = Math.floor(this._accumulator);
            this._accumulator -= toSpawn;
            if (toSpawn > 0) this.burst(toSpawn);
        }

        // Update alive particles
        for (let i = 0; i < this._particles.length; i++) {
            const p = this._particles[i];
            if (!p.alive) continue;

            p.age += dt;
            if (p.age >= p.lifetime) {
                p.alive = false;
                continue;
            }

            // Auto-integrate velocity → position
            p.position.x += p.velocity.x * dt;
            p.position.y += p.velocity.y * dt;
            p.position.z += p.velocity.z * dt;

            this.update?.(p, dt);
        }
    }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** @internal */
function createVec3(): Vec3Mut {
    return {
        x: 0,
        y: 0,
        z: 0,
        set(x: number, y: number, z: number) {
            this.x = x;
            this.y = y;
            this.z = z;
            return this;
        },
        randomDirection() {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            this.x = Math.sin(phi) * Math.cos(theta);
            this.y = Math.sin(phi) * Math.sin(theta);
            this.z = Math.cos(phi);
            return this;
        },
        scale(s: number) {
            this.x *= s;
            this.y *= s;
            this.z *= s;
            return this;
        },
    };
}

/** @internal */
function createColor(): ColorMut {
    return {
        r: 1,
        g: 1,
        b: 1,
        set(hex: number) {
            this.r = ((hex >> 16) & 0xff) / 255;
            this.g = ((hex >> 8) & 0xff) / 255;
            this.b = (hex & 0xff) / 255;
        },
    };
}

/** @internal */
function createParticle(): Particle {
    return {
        position: createVec3(),
        velocity: createVec3(),
        color: createColor(),
        opacity: 1,
        size: 1,
        age: 0,
        lifetime: 1,
        alive: false,
        userData: {},
    };
}

/** @internal */
function resetParticle(p: Particle): void {
    p.position.set(0, 0, 0);
    p.velocity.set(0, 0, 0);
    p.color.r = 1;
    p.color.g = 1;
    p.color.b = 1;
    p.opacity = 1;
    p.size = 1;
    p.age = 0;
    p.lifetime = 1;
    p.alive = false;
    p.userData = {};
}
