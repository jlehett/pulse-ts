/**
 * Seeded, deterministic pseudo-random number generator.
 *
 * Primordium's simulation must be reproducible: a given seed plus a given set of
 * card plays always produces the same ecosystem. The engine ships value noise but
 * no seeded PRNG, so this lives here for now (a candidate to upstream into
 * `@pulse-ts/core` once proven).
 *
 * Uses `mulberry32` — a tiny, fast, statistically decent 32-bit generator. Not
 * cryptographic; do not use for security.
 */

/**
 * A deterministic random stream. All methods advance the internal state.
 */
export interface Rng {
    /** Next float in `[0, 1)`. */
    next(): number;
    /** Integer in `[0, maxExclusive)`. Returns 0 if `maxExclusive <= 0`. */
    int(maxExclusive: number): number;
    /** Float in `[min, max)`. */
    range(min: number, max: number): number;
    /** True with probability `p` (default 0.5). */
    bool(p?: number): boolean;
    /** A uniformly chosen element of `arr`. Throws if `arr` is empty. */
    pick<T>(arr: readonly T[]): T;
    /**
     * A new independent stream, seeded deterministically from this one's current
     * state. Advances this stream. Useful for giving each subsystem (map gen,
     * combat, AI) its own reproducible substream.
     */
    fork(): Rng;
    /** The current raw 32-bit state, for snapshotting/replay. */
    state(): number;
}

/**
 * Hash an arbitrary string into a 32-bit integer seed (`xmur3`), so matches can
 * be seeded from human-readable strings.
 *
 * @param str - Seed string.
 * @returns A 32-bit unsigned integer suitable for {@link createRng}.
 *
 * @example
 * const rng = createRng(hashSeed('match-42'));
 */
export function hashSeed(str: string): number {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
        h = (h << 13) | (h >>> 19);
    }
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
}

/**
 * Create a deterministic {@link Rng} from a numeric seed.
 *
 * @param seed - Any number; only the low 32 bits matter. Use {@link hashSeed} for
 *   string seeds.
 * @returns A fresh independent random stream.
 *
 * @example
 * const rng = createRng(1234);
 * rng.next();          // always the same first value for seed 1234
 * rng.int(6) + 1;      // a d6 roll
 * rng.pick(['a', 'b']); // a deterministic choice
 */
export function createRng(seed: number): Rng {
    let a = seed >>> 0;

    const next = (): number => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    const rng: Rng = {
        next,
        int(maxExclusive) {
            if (maxExclusive <= 0) return 0;
            return Math.floor(next() * maxExclusive);
        },
        range(min, max) {
            return min + next() * (max - min);
        },
        bool(p = 0.5) {
            return next() < p;
        },
        pick(arr) {
            if (arr.length === 0) {
                throw new Error('Rng.pick: cannot pick from an empty array');
            }
            return arr[Math.floor(next() * arr.length)];
        },
        fork() {
            // Derive a new seed from a state advance so the substream is
            // reproducible but independent of the parent's subsequent draws.
            return createRng((next() * 4294967296) >>> 0);
        },
        state() {
            return a >>> 0;
        },
    };

    return rng;
}
