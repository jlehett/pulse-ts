import { Node } from '../ecs/node';
import {
    ancestors,
    descendants,
    siblings,
    traversePostOrder,
    traversePreOrder,
} from './traversal';
import { World } from './world';

describe('traversal helpers', () => {
    test('ancestors/descendants/siblings/traverse', () => {
        const w = new World();
        const a = w.add(new Node());
        const b = w.add(new Node());
        const c = w.add(new Node());
        a.addChild(b);
        b.addChild(c);

        expect([...ancestors(c)].map((n) => n.id)).toEqual([b.id, a.id]);
        expect([...descendants(a)].map((n) => n.id)).toEqual([b.id, c.id]);
        expect([...siblings(b)].map((n) => n.id)).toEqual([]);

        const pre: number[] = [];
        const post: number[] = [];
        traversePreOrder(a, (n) => pre.push(n.id));
        traversePostOrder(a, (n) => post.push(n.id));
        expect(pre).toEqual([a.id, b.id, c.id]);
        expect(post).toEqual([c.id, b.id, a.id]);
    });
});
