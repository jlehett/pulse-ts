import type { Vec } from '../../bindings/types';

export type PointerVec2Modifiers = {
    invertX?: boolean;
    invertY?: boolean;
    scaleX?: number;
    scaleY?: number;
};

/**
 * Accumulate scaled/inverted pointer delta into the per-action vec2 accumulator.
 */
export function accumulatePointerDelta(
    action: string,
    dx: number,
    dy: number,
    mod: PointerVec2Modifiers | undefined,
    vec2Accum: Map<string, Vec>,
): void {
    const sx = (mod?.scaleX ?? 1) * (mod?.invertX ? -1 : 1);
    const sy = (mod?.scaleY ?? 1) * (mod?.invertY ? -1 : 1);
    const acc = (vec2Accum.get(action) ?? { x: 0, y: 0 }) as Vec;
    acc['x'] = (acc['x'] ?? 0) + dx * sx;
    acc['y'] = (acc['y'] ?? 0) + dy * sy;
    vec2Accum.set(action, acc);
}
