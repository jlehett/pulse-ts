import type { Collider } from '../../public/components/Collider';

/** Returns a bit mask for a single layer index (0-31). */
export function layer(idx: number): number {
    const i = Math.max(0, Math.min(31, idx | 0));
    return (1 << i) >>> 0;
}

/** Combines multiple layer indices into a single mask. */
export function layers(...idx: number[]): number {
    let m = 0 >>> 0;
    for (const i of idx) m |= layer(i);
    return m >>> 0;
}

/** Sets the collider's layer by index (0-31). Returns the collider for chaining. */
export function setLayer(c: Collider, idx: number): Collider {
    c.layer = layer(idx);
    return c;
}

/** Replaces the collider's mask with the provided layer indices. Returns the collider for chaining. */
export function setMask(c: Collider, ...idx: number[]): Collider {
    c.mask = layers(...idx);
    return c;
}

/** Adds the specified layer indices to the collider's mask. Returns the collider for chaining. */
export function addToMask(c: Collider, ...idx: number[]): Collider {
    c.mask = (c.mask | layers(...idx)) >>> 0;
    return c;
}

/** Removes the specified layer indices from the collider's mask. Returns the collider for chaining. */
export function removeFromMask(c: Collider, ...idx: number[]): Collider {
    c.mask = (c.mask & ~layers(...idx)) >>> 0;
    return c;
}

/** Sets the collider to collide with all layers. Returns the collider for chaining. */
export function collideWithAll(c: Collider): Collider {
    c.mask = 0xffffffff >>> 0;
    return c;
}

/** Sets the collider to collide with no layers. Returns the collider for chaining. */
export function collideWithNone(c: Collider): Collider {
    c.mask = 0 >>> 0;
    return c;
}

/** Convenience predicate mirroring the engine's default filter. */
export function shouldCollide(a: Collider, b: Collider): boolean {
    return (a.mask & b.layer) !== 0 && (b.mask & a.layer) !== 0;
}
