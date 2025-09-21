import { Node } from '../ecs/node';
import { World } from './world';

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
});
