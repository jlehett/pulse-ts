import { Node } from '../ecs/node';
import { Transform } from '../components/Transform';
import { attachComponent } from '../ecs/componentRegistry';
import { World } from './world';

describe('World', () => {
    test('add/remove nodes and clearScene preserves system node', () => {
        const w = new World();
        // Culling system installs a system node on construction via registerSystemTick
        const baseCount = w.debugStats().nodes; // includes system node

        const a = new Node();
        const b = new Node();
        w.add(a);
        w.add(b);
        expect(w.debugStats().nodes).toBe(baseCount + 2);

        w.clearScene();
        expect(w.debugStats().nodes).toBe(baseCount); // only internal node remains
    });

    test('onNodeAdded/onNodeRemoved fire correctly', () => {
        const w = new World();
        const log: string[] = [];
        const offAdd = w.onNodeAdded((n) => log.push(`+${n.id}`));
        const offRem = w.onNodeRemoved((n) => log.push(`-${n.id}`));

        const a = w.add(new Node());
        const b = w.add(new Node());
        expect(log).toEqual([`+${a.id}`, `+${b.id}`]);

        w.remove(a);
        w.remove(b);
        expect(log).toEqual([`+${a.id}`, `+${b.id}`, `-${a.id}`, `-${b.id}`]);

        offAdd();
        offRem();
    });

    test('registerTick runs in frame and fixed phases with ordering', () => {
        const w = new World({ fixedStepMs: 10 });
        const n = w.add(new Node());
        const order: string[] = [];

        // frame early: -1, 0, 1
        w.registerTick(n, 'frame', 'early', () => order.push('f-early-0'), 0);
        w.registerTick(n, 'frame', 'early', () => order.push('f-early--1'), -1);
        w.registerTick(n, 'frame', 'early', () => order.push('f-early-1'), 1);

        // fixed update 2 entries
        let fixedCount = 0;
        w.registerTick(n, 'fixed', 'update', () => fixedCount++);

        // Far larger than fixed step to accumulate several fixed ticks
        w.tick(35); // ms
        // One frame execution of frame early, and >=3 fixed steps
        expect(order.slice(0, 3)).toEqual([
            'f-early--1',
            'f-early-0',
            'f-early-1',
        ]);
        expect(fixedCount).toBeGreaterThanOrEqual(3);

        // Disabling a phase prevents execution
        w.setPhaseEnabled('frame', 'early', false);
        const len = order.length;
        w.tick(16);
        expect(order.length).toBe(len);

        // Re-enable and ensure it runs again
        w.setPhaseEnabled('frame', 'early', true);
        w.tick(1);
        expect(order.length).toBeGreaterThan(len);
    });

    test('newly-registered ticks during a phase run next frame (lane boundary)', () => {
        const w = new World();
        const n = w.add(new Node());
        const calls: string[] = [];
        w.registerTick(n, 'frame', 'update', () => {
            calls.push('first');
            w.registerTick(n, 'frame', 'update', () => calls.push('second'));
        });
        w.tick(16);
        expect(calls).toEqual(['first']);
        w.tick(16);
        expect(calls).toEqual(['first', 'first', 'second']);
    });

    test('query sugar returns typed tuples', () => {
        const w = new World();
        const n = w.add(new Node());
        const tComp = attachComponent(n, Transform);
        const Q = w.query([Transform]);
        const rows = Array.from(Q.run());
        expect(rows.length).toBe(1);
        const [node, outT] = rows[0]!;
        expect(node).toBe(n);
        expect(outT).toBe(tComp);
        expect(Q.some()).toBe(true);
        expect(Q.count()).toBe(1);
    });

    test('setNodeTicksEnabled toggles execution', () => {
        const w = new World();
        const n = w.add(new Node());
        let c = 0;
        w.registerTick(n, 'frame', 'update', () => c++);
        w.tick(16);
        expect(c).toBe(1);
        w.setNodeTicksEnabled(n, false);
        w.tick(16);
        expect(c).toBe(1);
        // Re-enabling does not restore previously unlinked registrations; register again
        w.setNodeTicksEnabled(n, true);
        w.registerTick(n, 'frame', 'update', () => c++);
        w.tick(16);
        expect(c).toBe(2);
    });

    test('debugStats reflects disabled phases', () => {
        const w = new World();
        const n = w.add(new Node());
        let c = 0;
        w.registerTick(n, 'frame', 'early', () => c++);
        w.tick(16);
        expect(c).toBe(1);
        const stats1 = w.debugStats();
        expect(stats1.ticks.frame.early.disabled).toBe(false);

        w.setPhaseEnabled('frame', 'early', false);
        w.tick(16);
        expect(c).toBe(1);
        const stats2 = w.debugStats();
        expect(stats2.ticks.frame.early.disabled).toBe(true);

        w.setPhaseEnabled('frame', 'early', true);
        w.tick(16);
        expect(c).toBe(2);
        const stats3 = w.debugStats();
        expect(stats3.ticks.frame.early.disabled).toBe(false);
    });
});
