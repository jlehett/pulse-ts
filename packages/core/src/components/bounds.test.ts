import { World } from '../world';
import { Node } from '../node';
import { Bounds } from './Bounds';
import { Transform } from './Transform';
import { attachComponent } from '../componentRegistry';
import { Vec3 } from '../math/vec3';

describe('Bounds', () => {
    test('world AABB from local and transform, with cache at alpha 0', () => {
        const w = new World();
        const n = w.add(new Node());
        const t = attachComponent(n, Transform);
        const b = attachComponent(n, Bounds);
        b.setLocal(new Vec3(-1, -2, -3), new Vec3(1, 2, 3));
        t.setLocal({
            position: { x: 5, y: 0, z: 0 },
            scale: { x: 2, y: 1, z: 1 },
        });

        const a0 = b.getWorld(undefined, 0)!;
        expect(a0.min.x).toBeCloseTo(3);
        expect(a0.max.x).toBeCloseTo(7);

        // Calling again with no changes returns same cached bounds object values
        const out = { min: new Vec3(), max: new Vec3() };
        const a1 = b.getWorld(out, 0)!;
        expect(a1.min.x).toBe(3);
        expect(a1.max.x).toBe(7);

        // Change transform to invalidate cache
        t.setLocal({ position: { x: 6 } });
        const a2 = b.getWorld(undefined, 0)!;
        expect(a2.min.x).toBeCloseTo(4);
        expect(a2.max.x).toBeCloseTo(8);
    });
});
