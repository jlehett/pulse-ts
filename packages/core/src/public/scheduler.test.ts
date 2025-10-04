import { World } from '../domain/world/world';
import { ManualScheduler } from './scheduler';
import { Node } from '../domain/ecs/base/node';

describe('public scheduler adapters', () => {
    test('ManualScheduler drives world.start via step()', () => {
        const sched = new ManualScheduler();
        const w = new World({ fixedStepMs: 10, scheduler: sched });
        let c = 0;
        const node = w.add(new Node());
        w.registerTick(node, 'frame', 'update', () => c++);

        w.start();
        sched.step();
        expect(c).toBe(1);

        w.stop();
        sched.step();
        expect(c).toBe(1); // no additional steps after stop
    });
});
