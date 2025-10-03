import { World } from '../world/world';
import { Node } from '../ecs/base/node';
import {
    attachComponent,
    getComponent,
} from '../ecs/registry/componentRegistry';
import { Bounds } from '../components/spatial/Bounds';
import { Vec3 } from '../../utils/math/vec3';
import { Transform } from '../components/spatial/Transform';
import { CullingCamera } from '../services/CullingCamera';
import { Visibility } from '../components/meta/Visibility';

function identityPV(): Float32Array {
    // Identity 4x4 (column-major) defines clip-space cube [-1,1] on x/y/z
    // This matches the Frustum extraction in CullingSystem for a simple test frustum.
    const m = new Float32Array(16);
    m[0] = 1; // col 0, row 0
    m[5] = 1; // col 1, row 1
    m[10] = 1; // col 2, row 2
    m[15] = 1; // col 3, row 3
    return m;
}

describe('CullingSystem', () => {
    test('updates Visibility based on frustum vs world AABB', () => {
        const w = new World();
        // Provide a simple camera frustum (identity clip cube)
        w.provideService(new CullingCamera(identityPV()));

        // Inside cube: centered at origin, radius 0.5
        const inside = w.add(new Node());
        attachComponent(inside, Transform).setLocal({
            position: { x: 0, y: 0, z: 0 },
        });
        attachComponent(inside, Bounds).setLocal(
            new Vec3(-0.5, -0.5, -0.5),
            new Vec3(0.5, 0.5, 0.5),
        );

        // Outside cube: shifted beyond +X=1
        const outside = w.add(new Node());
        attachComponent(outside, Transform).setLocal({
            position: { x: 2, y: 0, z: 0 },
        });
        attachComponent(outside, Bounds).setLocal(
            new Vec3(-0.25, -0.25, -0.25),
            new Vec3(0.25, 0.25, 0.25),
        );

        // Run one frame to execute CullingSystem (frame/update)
        w.tick(16);

        const vIn = getComponent(inside, Visibility)!;
        const vOut = getComponent(outside, Visibility)!;
        expect(vIn.visible).toBe(true);
        expect(vOut.visible).toBe(false);
    });
});
