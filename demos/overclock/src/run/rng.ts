/**
 * Deterministic, serializable RNG for run generation and combat. A run's
 * whole future is a function of its seed string plus draw count, so saving
 * the 32-bit state is enough to resume mid-run.
 */

/** A seedable random source with helpers. */
export interface Rng {
    /** Uniform float in [0, 1). */
    next(): number;
    /** Uniform integer in [0, n). */
    int(n: number): number;
    /** Picks a uniform element (throws on empty arrays). */
    pick<T>(arr: readonly T[]): T;
    /** Current 32-bit state (save/restore for persistence). */
    getState(): number;
    setState(state: number): void;
}

/** Hashes an arbitrary string to a 32-bit seed (xmur3 finalizer). */
export function seedFromString(str: string): number {
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
 * Creates a mulberry32 RNG.
 *
 * @param seed - Numeric state or a seed string (hashed).
 * @returns A deterministic {@link Rng}.
 *
 * @example
 * const rng = createRng('OVR-3F9K2');
 * rng.int(10); // same sequence for the same seed
 */
export function createRng(seed: number | string): Rng {
    let state = typeof seed === 'string' ? seedFromString(seed) : seed >>> 0;

    const next = (): number => {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    return {
        next,
        int: (n) => Math.floor(next() * n),
        pick: (arr) => {
            if (arr.length === 0) throw new Error('pick from empty array');
            return arr[Math.floor(next() * arr.length)];
        },
        getState: () => state,
        setState: (s) => {
            state = s >>> 0;
        },
    };
}

/** Alphabet for display seeds (no ambiguous 0/O/1/I). */
const SEED_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generates a human-readable run seed like `OVR-7X24Q`.
 *
 * @param random - Entropy source (defaults to Math.random).
 */
export function randomSeedString(random: () => number = Math.random): string {
    let tail = '';
    for (let i = 0; i < 5; i++) {
        tail += SEED_CHARS[Math.floor(random() * SEED_CHARS.length)];
    }
    return `OVR-${tail}`;
}
