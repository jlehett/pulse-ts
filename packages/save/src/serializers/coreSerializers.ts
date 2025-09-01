import { Vec3 } from '@pulse-ts/core';
import { Bounds } from '@pulse-ts/core';
import { Visibility } from '@pulse-ts/core';
import { Transform } from '@pulse-ts/core';
import { attachComponent } from '@pulse-ts/core';
import type { Node } from '@pulse-ts/core';
import { registerComponentSerializer } from '../registries/componentRegistry';
import { State, StableId } from '@pulse-ts/core';

/**
 * Register all of the @pulse-ts/core components/services with the save system.
 */
export function registerCoreSerializers() {
    // Transform
    registerComponentSerializer(Transform, {
        id: 'core:transform',
        serialize(_owner, t) {
            return {
                p: [t.localPosition.x, t.localPosition.y, t.localPosition.z],
                r: [
                    t.localRotation.x,
                    t.localRotation.y,
                    t.localRotation.z,
                    t.localRotation.w,
                ],
                s: [t.localScale.x, t.localScale.y, t.localScale.z],
            };
        },
        deserialize(owner: Node, data: any) {
            const t = (Transform as any).attach ? undefined : undefined; // type hints only
            const d = data as {
                p: [number, number, number];
                r: [number, number, number, number];
                s: [number, number, number];
            };
            const comp = attachComponent(owner, Transform);
            (comp as Transform).setLocal({
                position: { x: d.p[0], y: d.p[1], z: d.p[2] },
                rotationQuat: {
                    x: d.r[0],
                    y: d.r[1],
                    z: d.r[2],
                    w: d.r[3],
                },
                scale: { x: d.s[0], y: d.s[1], z: d.s[2] },
            });
        },
    });

    // Bounds
    registerComponentSerializer(Bounds, {
        id: 'core:bounds',
        serialize(_owner, b) {
            const local = b.getLocal();
            if (!local) return undefined;
            return {
                min: [local.min.x, local.min.y, local.min.z],
                max: [local.max.x, local.max.y, local.max.z],
            };
        },
        deserialize(owner: Node, data: any) {
            const comp = attachComponent(owner, Bounds);
            const min = new Vec3(data.min[0], data.min[1], data.min[2]);
            const max = new Vec3(data.max[0], data.max[1], data.max[2]);
            (comp as Bounds).setLocal(min, max);
        },
    });

    // Visibility
    registerComponentSerializer(Visibility, {
        id: 'core:visibility',
        serialize(_owner, v) {
            return { visible: !!v.visible };
        },
        deserialize(owner: Node, data: any) {
            const comp = attachComponent(owner, Visibility);
            (comp as Visibility).visible = !!data.visible;
        },
    });

    // State (generic key/value store)
    registerComponentSerializer(State, {
        id: 'core:state',
        serialize(_owner, s: any) {
            try {
                const entries = (s as State).entries();
                return { e: entries };
            } catch {
                return undefined;
            }
        },
        deserialize(owner: Node, data: any) {
            const comp = attachComponent(owner, State);
            if (data && Array.isArray(data.e))
                (comp as State).loadEntries(data.e);
        },
    });

    // StableId (string)
    registerComponentSerializer(StableId, {
        id: 'core:stableId',
        serialize(_owner, s: any) {
            return { id: (s as StableId).id };
        },
        deserialize(owner: Node, data: any) {
            const comp = attachComponent(owner, StableId);
            (comp as StableId).id = String(data?.id ?? '');
        },
    });
}
