import { World, Node, attachComponent, Transform, Vec3 } from '@pulse-ts/core';
import { Collider } from '../../../public/components/Collider';
import { raycast } from './raycast';

describe('raycast unit', () => {
    it('applies filter predicate and mask options', () => {
        const world = new World();
        const n1 = new Node();
        const n2 = new Node();
        world.add(n1);
        world.add(n2);
        const t1 = attachComponent(n1, Transform);
        t1.localPosition.set(0, 0, 0);
        const t2 = attachComponent(n2, Transform);
        t2.localPosition.set(2, 0, 0);
        const c1 = attachComponent(n1, Collider);
        c1.kind = 'box';
        c1.halfX = c1.halfY = c1.halfZ = 0.25;
        c1.layer = 1 << 1; // layer index 1
        const c2 = attachComponent(n2, Collider);
        c2.kind = 'box';
        c2.halfX = c2.halfY = c2.halfZ = 0.25;
        c2.layer = 1 << 2; // layer index 2
        const origin = new Vec3(-1, 0, 0);
        const dir = new Vec3(1, 0, 0);
        // Mask only layer 2
        const hit2 = raycast([c1, c2], origin, dir, { mask: 1 << 2 });
        expect(hit2).not.toBeNull();
        expect(hit2!.node).toBe(n2);
        // Predicate excludes n2
        const hitNone = raycast([c1, c2], origin, dir, {
            mask: 0xffffffff,
            filter: (c) => c !== c2,
        });
        expect(hitNone).not.toBeNull();
        expect(hitNone!.node).toBe(n1);
    });
});
