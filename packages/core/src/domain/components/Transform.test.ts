import { attachComponent } from '../ecs/componentRegistry';
import { Node } from '../ecs/node';
import { World } from '../world/world';
import { Transform } from './Transform';

describe('Transform', () => {
    test('local setters and snapshot previous', () => {
        const w = new World();
        const n = w.add(new Node());
        const t = attachComponent(n, Transform);
        t.setLocal({
            position: { x: 1, y: 2, z: 3 },
            scale: { x: 2, y: 2, z: 2 },
        });
        const l0 = t.getLocalTRS(undefined, 0);
        expect(l0.position).toMatchObject({ x: 1, y: 2, z: 3 });
        expect(l0.scale).toMatchObject({ x: 2, y: 2, z: 2 });

        // snapshot moves current->previous
        t.snapshotPrevious();
        // interpolate with alpha 1 should equal current
        const l1 = t.getLocalTRS(undefined, 1);
        expect(l1.position).toMatchObject({ x: 1, y: 2, z: 3 });
    });

    test('world composition with parent position/scale', () => {
        const w = new World();
        const parent = w.add(new Node());
        const child = w.add(new Node());
        parent.addChild(child);
        const pt = attachComponent(parent, Transform);
        const ct = attachComponent(child, Transform);

        pt.setLocal({
            position: { x: 10, y: 0, z: 0 },
            scale: { x: 2, y: 2, z: 2 },
        });
        ct.setLocal({
            position: { x: 1, y: 0, z: 0 },
            scale: { x: 3, y: 1, z: 1 },
        });

        const wChild = ct.getWorldTRS(undefined, 0);
        expect(wChild.position.x).toBeCloseTo(12); // (1 * parent.scale.x) + parent.pos.x
        expect(wChild.scale.x).toBeCloseTo(6); // 3 * 2
    });
});
