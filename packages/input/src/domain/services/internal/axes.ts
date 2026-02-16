import type { ActionState, Vec } from '../../bindings/types';

export type Vec2Def = {
    key1: string;
    key2: string;
    axis1: string;
    axis2: string;
    invert1?: boolean;
    invert2?: boolean;
};

/**
 * Compose a vec2 value object from two 1D axis action states.
 */
export function composeVec2From1D(
    def: Vec2Def,
    actions: Map<string, ActionState>,
): Vec {
    const v1 = actions.get(def.axis1)?.value ?? 0;
    const v2 = actions.get(def.axis2)?.value ?? 0;
    const a = (def.invert1 ? -1 : 1) * v1;
    const b = (def.invert2 ? -1 : 1) * v2;
    const obj: Vec = {};
    obj[def.key1] = a;
    obj[def.key2] = b;
    return obj;
}
