import { Vec3 } from '../../../utils/math/vec3';
import { attachComponent } from '../../ecs/registry/componentRegistry';
import { Node } from '../../ecs/base/node';
import { World } from '../../world/world';
import { Bounds } from './Bounds';
import { Transform } from './Transform';

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

        const out = { min: new Vec3(), max: new Vec3() };
        const a1 = b.getWorld(out, 0)!;
        expect(a1.min.x).toBe(3);
        expect(a1.max.x).toBe(7);

        t.setLocal({ position: { x: 6 } });
        const a2 = b.getWorld(undefined, 0)!;
        expect(a2.min.x).toBeCloseTo(4);
        expect(a2.max.x).toBeCloseTo(8);
    });
});
