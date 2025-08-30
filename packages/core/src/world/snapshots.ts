import type { Node } from '../node';
import { maybeGetTransform, type Transform } from '../transform';

/**
 * The world snapshot.
 */
export type WorldSnapshot = {
    /**
     * The transforms recorded in the snapshot.
     */
    transforms: Array<{
        id: number;
        p: [number, number, number];
        r: [number, number, number, number];
        s: [number, number, number];
    }>;
    /**
     * The accumulator value of the world at the time of the snapshot.
     */
    accumulator: number;
};

/**
 * The snapshotter.
 */
export class Snapshotter {
    /**
     * Constructs a new snapshotter.
     * @param idToNode The map of node IDs to nodes.
     * @param transforms The set of transforms.
     */
    constructor(
        private readonly idToNode: Map<number, Node>,
        private readonly transforms: Set<Transform>,
    ) {}

    /**
     * Saves the world snapshot.
     * @param accumulator The accumulator value of the world at the time of the snapshot.
     * @returns The world snapshot.
     */
    save(accumulator: number): WorldSnapshot {
        const transforms: WorldSnapshot['transforms'] = [];
        for (const t of this.transforms) {
            const n = t.owner;
            transforms.push({
                id: n.id,
                p: [t.localPosition.x, t.localPosition.y, t.localPosition.z],
                r: [
                    t.localRotation.x,
                    t.localRotation.y,
                    t.localRotation.z,
                    t.localRotation.w,
                ],
                s: [t.localScale.x, t.localScale.y, t.localScale.z],
            });
        }
        return { transforms, accumulator };
    }

    /**
     * Restores the world snapshot.
     * @param snap The world snapshot.
     * @param opts The options for the restore.
     * @param opts.strict Whether to throw an error if a node is missing.
     * @param opts.resetPrevious Whether to reset the previous snapshot.
     * @returns The accumulator value of the world after the restore.
     */
    restore(
        snap: WorldSnapshot,
        opts?: { strict?: boolean; resetPrevious?: boolean },
    ) {
        const strict = !!opts?.strict;

        for (const rec of snap.transforms) {
            const node = this.idToNode.get(rec.id);
            if (!node) {
                if (strict)
                    throw new Error(`restoreSnapshot: missing node ${rec.id}`);
                else continue;
            }
            const t = maybeGetTransform(node);
            if (!t) continue;
            t.setLocal({
                position: { x: rec.p[0], y: rec.p[1], z: rec.p[2] },
                rotationQuat: {
                    x: rec.r[0],
                    y: rec.r[1],
                    z: rec.r[2],
                    w: rec.r[3],
                },
                scale: { x: rec.s[0], y: rec.s[1], z: rec.s[2] },
            });
            if (opts?.resetPrevious) t.snapshotPrevious();
        }
        return snap.accumulator;
    }
}
