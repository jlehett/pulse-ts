import { Node } from './node';
import { fixedLate } from '../capabilities/tick';
import { maybeGetTransform } from '../capabilities/transform';

export class TransformCommitter extends Node {
    @fixedLate({ order: Number.MIN_SAFE_INTEGER })
    commitAllTransforms(_dt: number): void {
        const world = this.world;
        if (!world) return;
        for (const node of world.nodes.values()) {
            const t = maybeGetTransform(node);
            if (t) t.commit();
        }
    }
}
