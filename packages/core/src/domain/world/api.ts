/**
 * Minimal World timing API used by components to avoid tight coupling.
 * Implemented by World; imported here as a type-only dependency.
 */
export interface WorldTimingApi {
    /** Returns ambient alpha (0..1) for the current frame. */
    getAmbientAlpha(): number;
    /** Returns the current frame id. */
    getFrameId(): number;
}

/**
 * Minimal registration API used by Transform to notify the World
 * when a Transform is attached/detached so the World can snapshot
 * and compose transforms efficiently.
 */
export interface WorldTransformRegistry {
    registerTransform(t: import('../components/Transform').Transform): void;
    unregisterTransform(t: import('../components/Transform').Transform): void;
}
