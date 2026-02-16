import { World } from '../../world/world';
import { Node } from '../base/node';
import { attachComponent } from '../registry/componentRegistry';
import { Transform } from '../../components/spatial/Transform';
import { Bounds } from '../../components/spatial/Bounds';
import { Visibility } from '../../components/meta/Visibility';
import { defineQuery, query } from './index';

describe('typed queries', () => {
    test('has-only query yields node and components in order', () => {
        const w = new World();
        const n = w.add(new Node());
        const t = attachComponent(n, Transform);
        const b = attachComponent(n, Bounds);

        const QB = defineQuery([Transform, Bounds]);
        const rows = Array.from(QB.run(w));
        expect(rows.length).toBe(1);
        const [node, t1, b1] = rows[0]!;
        expect(node).toBe(n);
        expect(t1).toBe(t);
        expect(b1).toBe(b);
    });

    test('has + not query filters by exclusion set', () => {
        const w = new World();
        const a = w.add(new Node());
        const b = w.add(new Node());
        attachComponent(a, Transform);
        attachComponent(a, Bounds);
        attachComponent(b, Transform);
        attachComponent(b, Bounds);
        // Exclude nodes that have Visibility
        attachComponent(b, Visibility);

        const Q = defineQuery([Transform, Bounds], { not: [Visibility] });
        const nodes = Array.from(Q.run(w)).map(([n]) => n);
        expect(nodes).toEqual([a]);
    });

    test('query() convenience matches defineQuery', () => {
        const w = new World();
        const n = w.add(new Node());
        const t = attachComponent(n, Transform);

        const rows = Array.from(query(w, [Transform]));
        expect(rows.length).toBe(1);
        const [node, outT] = rows[0]!;
        expect(node).toBe(n);
        expect(outT).toBe(t);
    });

    test('dynamic changes reflected on subsequent runs', () => {
        const w = new World();
        const Q = defineQuery([Transform]);
        expect(Array.from(Q.run(w)).length).toBe(0);
        const n = w.add(new Node());
        attachComponent(n, Transform);
        expect(Array.from(Q.run(w)).length).toBe(1);
    });

    test('multi-world isolation with internal index', () => {
        const w1 = new World();
        const w2 = new World();
        const n1 = w1.add(new Node());
        const n2 = w2.add(new Node());
        attachComponent(n1, Transform);
        attachComponent(n2, Transform);
        const Q = defineQuery([Transform]);
        const ids1 = Array.from(Q.run(w1)).map(([n]) => n.id);
        const ids2 = Array.from(Q.run(w2)).map(([n]) => n.id);
        expect(ids1).toEqual([n1.id]);
        expect(ids2).toEqual([n2.id]);
    });

    test('attach before add to world, then add, then query finds it', () => {
        const w = new World();
        const n = new Node();
        attachComponent(n, Transform);
        const Q = defineQuery([Transform]);
        // Not yet added to world -> no result
        expect(Array.from(Q.run(w)).length).toBe(0);
        w.add(n);
        expect(Array.from(Q.run(w)).length).toBe(1);
    });

    test('destroy cleanup removes node from index results', () => {
        const w = new World();
        const n = w.add(new Node());
        attachComponent(n, Transform);
        const Q = defineQuery([Transform]);
        expect(Array.from(Q.run(w)).length).toBe(1);
        n.destroy();
        expect(Array.from(Q.run(w)).length).toBe(0);
    });
});
