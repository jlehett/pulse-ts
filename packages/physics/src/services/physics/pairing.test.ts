import { World, Node, attachComponent, Transform } from '@pulse-ts/core';
import { Collider } from '../../components/Collider';
import { findPairs } from './pairing';

describe('pairing/grid broadphase', () => {
    function addSphere(world: World, x: number, y: number, z: number, r = 0.5) {
        const n = new Node(); world.add(n);
        const t = attachComponent(n, Transform); t.localPosition.set(x, y, z);
        const c = attachComponent(n, Collider); c.kind = 'sphere'; c.radius = r;
        return c;
    }

    it('pairs close objects and includes planes with all', () => {
        const world = new World();
        const a = addSphere(world, 0, 0, 0);
        const b = addSphere(world, 0.8, 0, 0);
        const far = addSphere(world, 10, 0, 0);
        // plane
        const pn = new Node(); world.add(pn);
        attachComponent(pn, Transform);
        const plane = attachComponent(pn, Collider); plane.kind = 'plane';
        const pairs = findPairs([a, b, far, plane], 1);
        // should include (a,b) and plane with each
        const normKey = (x: any, y: any) => [x.owner.id, y.owner.id].sort((m: number,n: number)=>m-n).join('|');
        const keys = pairs.map(([x,y]) => normKey(x,y));
        const uniq = new Set(keys);
        expect(uniq.size).toBe(keys.length);
        const ids = (c: any) => c.owner.id;
        expect(keys).toContain(normKey(a,b));
        // plane paired with a and b and far
        expect(keys).toContain(normKey(plane, a));
        expect(keys).toContain(normKey(plane, b));
        expect(keys).toContain(normKey(plane, far));
    });
});
