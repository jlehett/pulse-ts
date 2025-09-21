import { World } from '../world';
import { useChild, useComponent, useInit, useService, useState } from './hooks';
import { Transform } from '../components/Transform';
import { Service } from '../Service';

class DemoService extends Service {
    n = 42;
}

describe('FC hooks', () => {
    test('useInit/useDestroy and useChild lifecycles', () => {
        const w = new World();
        let inits = 0;
        let destroys = 0;

        function Child() {
            useInit(() => {
                inits++;
                return () => void destroys++;
            });
        }

        function Parent() {
            useChild(Child);
        }

        const node = w.mount(Parent);
        expect(inits).toBe(1);
        // Parent has a child
        expect(node.children.length).toBe(1);
        node.destroy();
        expect(destroys).toBe(1);
    });

    test('useComponent single instance and Transform presence', () => {
        const w = new World();
        let inst: Transform | null = null;
        function C() {
            const t1 = useComponent(Transform);
            const t2 = useComponent(Transform);
            inst = t1;
            expect(t1).toBe(t2);
        }
        const n = w.mount(C);
        expect(inst).toBeTruthy();
        // World should have registered transform for zero-alpha composition
        (inst as Transform).getWorldTRS(undefined, 0);
        expect(w.debugStats().transforms).toBe(1);
        n.destroy();
        expect(w.debugStats().transforms).toBe(0);
    });

    test('useState get/set API', () => {
        const w = new World();
        let getters: (() => number) | null = null;
        let setters: ((v: number | ((p: number) => number)) => void) | null =
            null;
        function Counter() {
            const [get, set] = useState('count', 0);
            getters = get;
            setters = set;
        }
        w.mount(Counter);
        expect(getters!()).toBe(0);
        setters!(5);
        expect(getters!()).toBe(5);
        setters!((p) => p + 2);
        expect(getters!()).toBe(7);
    });

    test('useService resolves provided service', () => {
        const w = new World();
        w.provideService(new DemoService());
        let value: number | null = null;
        function Reader() {
            const s = useService(DemoService)!;
            value = s?.n ?? null;
        }
        w.mount(Reader);
        expect(value).toBe(42);
    });
});
