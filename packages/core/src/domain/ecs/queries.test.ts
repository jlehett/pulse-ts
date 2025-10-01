import { World } from '../world/world';
import { Node } from './node';
import { attachComponent } from './componentRegistry';
import { Transform } from '../components/Transform';
import { Bounds } from '../components/Bounds';
import { Visibility } from '../components/Visibility';
import { defineQuery, query } from './queries';

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
});
