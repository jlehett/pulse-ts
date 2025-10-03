import { World } from '../../world/world';
import { Node } from './node';

describe('Node', () => {
    test('prevent cycles when reparenting', () => {
        const w = new World();
        const a = w.add(new Node());
        const b = w.add(new Node());
        const c = w.add(new Node());
        a.addChild(b);
        b.addChild(c);
        // Attempting to parent ancestor under descendant should throw
        expect(() => c.addChild(a)).toThrow();
    });

    test('destroy unlinks registered ticks', () => {
        const w = new World();
        const n = w.add(new Node());
        let count = 0;
        w.registerTick(n, 'frame', 'update', () => count++);
        w.tick(16);
        expect(count).toBe(1);
        // Destroy the node; registered ticks should be disposed
        n.destroy();
        w.tick(16);
        expect(count).toBe(1);
    });
});
