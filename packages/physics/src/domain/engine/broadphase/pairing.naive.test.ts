import { World, Node, attachComponent, Transform } from '@pulse-ts/core';
import { Collider } from '../../../public/components/Collider';
import { findPairs } from './pairing';

describe('pairing naive fallback', () => {
    it('returns all unique pairs when cellSize invalid', () => {
        const world = new World();
        const nodes: Node[] = [];
        const cols: Collider[] = [];
        for (let i = 0; i < 3; i++) {
            const n = new Node();
            nodes.push(n);
            world.add(n);
            const t = attachComponent(n, Transform);
            t.localPosition.set(i * 10, 0, 0);
            const c = attachComponent(n, Collider);
            c.kind = 'sphere';
            c.radius = 0.5;
            cols.push(c);
        }
        const pairs = findPairs(cols, 0); // invalid cellSize -> naive
        expect(pairs.length).toBe(3); // 3C2 = 3 pairs
    });
});
