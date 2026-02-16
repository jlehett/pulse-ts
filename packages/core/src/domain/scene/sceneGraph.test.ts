import { Node } from '../ecs/base/node';
import { World } from '../world/world';

describe('SceneGraph parent changes', () => {
    test('onNodeParentChanged fires with correct old/new', () => {
        const w = new World();
        const a = w.add(new Node());
        const b = w.add(new Node());
        const c = w.add(new Node());
        a.addChild(b);
        let msg: string[] = [];
        const off = w.onNodeParentChanged(({ node, oldParent, newParent }) => {
            msg.push(`${node.id}:${oldParent?.id ?? 0}->${newParent?.id ?? 0}`);
        });

        // reparent b under c
        w.reparent(b, c);
        expect(b.parent).toBe(c);
        expect(msg[msg.length - 1]).toBe(`${b.id}:${a.id}->${c.id}`);

        // detach
        w.reparent(b, null);
        expect(b.parent).toBeNull();
        expect(msg[msg.length - 1]).toBe(`${b.id}:${c.id}->0`);
        off();
    });

    test('cross-world reparent removes from old world and adds to new', () => {
        const w1 = new World();
        const w2 = new World();
        const a = w1.add(new Node());
        const parent2 = w2.add(new Node());

        const removed: number[] = [];
        const added: number[] = [];
        const off1 = w1.onNodeRemoved((n) => removed.push(n.id));
        const off2 = w2.onNodeAdded((n) => added.push(n.id));

        // Move `a` under `parent2` (cross-world)
        w1.reparent(a, parent2);

        expect(a.world).toBe(w2);
        expect(parent2.children.includes(a)).toBe(true);
        expect(w1.nodes.has(a)).toBe(false);
        expect(w2.nodes.has(a)).toBe(true);
        expect(removed).toContain(a.id);
        expect(added).toContain(a.id);

        off1();
        off2();
    });
});
