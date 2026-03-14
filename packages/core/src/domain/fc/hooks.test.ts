import { Transform } from '../components/spatial/Transform';
import { Service } from '../ecs/base/Service';
import { World } from '../world/world';
import {
    useChild,
    useConditionalChild,
    useComponent,
    useDestroy,
    useFixedUpdate,
    useFrameUpdate,
    useInit,
    useService,
    useState,
} from './hooks';

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
        (inst as unknown as Transform).getWorldTRS(undefined, 0);
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

    describe('when guard', () => {
        const FIXED_MS = 10;

        function createWorld() {
            return new World({ fixedStepMs: FIXED_MS });
        }

        test('useFixedUpdate skips callback when guard returns false', () => {
            const w = createWorld();
            const state = { active: false };
            let callCount = 0;

            w.mount(() => {
                useFixedUpdate(
                    () => {
                        callCount++;
                    },
                    { when: () => state.active },
                );
            });

            w.tick(FIXED_MS);
            expect(callCount).toBe(0);

            state.active = true;
            w.tick(FIXED_MS);
            expect(callCount).toBe(1);

            state.active = false;
            w.tick(FIXED_MS);
            expect(callCount).toBe(1); // still 1
        });

        test('useFrameUpdate skips callback when guard returns false', () => {
            const w = createWorld();
            const state = { active: false };
            let callCount = 0;

            w.mount(() => {
                useFrameUpdate(
                    () => {
                        callCount++;
                    },
                    { when: () => state.active },
                );
            });

            w.tick(FIXED_MS);
            expect(callCount).toBe(0);

            state.active = true;
            w.tick(FIXED_MS);
            expect(callCount).toBe(1);
        });

        test('guard is evaluated each tick', () => {
            const w = createWorld();
            let guardCalls = 0;

            w.mount(() => {
                useFixedUpdate(() => {}, {
                    when: () => {
                        guardCalls++;
                        return false;
                    },
                });
            });

            w.tick(FIXED_MS);
            w.tick(FIXED_MS);
            w.tick(FIXED_MS);
            expect(guardCalls).toBe(3);
        });

        test('backward compatible — no when option means always runs', () => {
            const w = createWorld();
            let callCount = 0;

            w.mount(() => {
                useFixedUpdate(() => {
                    callCount++;
                });
            });

            w.tick(FIXED_MS);
            w.tick(FIXED_MS);
            expect(callCount).toBe(2);
        });
    });

    describe('useConditionalChild', () => {
        const FIXED_MS = 10;

        function createWorld() {
            return new World({ fixedStepMs: FIXED_MS });
        }

        test('mounts child when guard becomes true', () => {
            const w = createWorld();
            const state = { active: false };
            let childInits = 0;

            function Child() {
                useInit(() => {
                    childInits++;
                });
            }

            const parent = w.mount(() => {
                useConditionalChild(() => state.active, Child);
            });

            // Guard is false — no child yet
            w.tick(FIXED_MS);
            expect(parent.children.length).toBe(0);
            expect(childInits).toBe(0);

            // Guard becomes true — child mounted
            state.active = true;
            w.tick(FIXED_MS);
            expect(parent.children.length).toBe(1);
            expect(childInits).toBe(1);
        });

        test('destroys child when guard becomes false', () => {
            const w = createWorld();
            const state = { active: true };
            let childDestroys = 0;

            function Child() {
                useDestroy(() => {
                    childDestroys++;
                });
            }

            const parent = w.mount(() => {
                useConditionalChild(() => state.active, Child);
            });

            // Mount child
            w.tick(FIXED_MS);
            expect(parent.children.length).toBe(1);

            // Guard becomes false — child destroyed
            state.active = false;
            w.tick(FIXED_MS);
            expect(parent.children.length).toBe(0);
            expect(childDestroys).toBe(1);
        });

        test('re-mounts child after guard cycles false → true again', () => {
            const w = createWorld();
            const state = { active: true };
            let childInits = 0;

            function Child() {
                useInit(() => {
                    childInits++;
                });
            }

            const parent = w.mount(() => {
                useConditionalChild(() => state.active, Child);
            });

            w.tick(FIXED_MS); // mount
            expect(childInits).toBe(1);

            state.active = false;
            w.tick(FIXED_MS); // destroy
            expect(parent.children.length).toBe(0);

            state.active = true;
            w.tick(FIXED_MS); // re-mount
            expect(parent.children.length).toBe(1);
            expect(childInits).toBe(2);
        });

        test('child is cleaned up when parent is destroyed', () => {
            const w = createWorld();
            const state = { active: true };
            let childDestroys = 0;

            function Child() {
                useDestroy(() => {
                    childDestroys++;
                });
            }

            const parent = w.mount(() => {
                useConditionalChild(() => state.active, Child);
            });

            w.tick(FIXED_MS); // mount child
            expect(parent.children.length).toBe(1);

            parent.destroy();
            expect(childDestroys).toBe(1);
        });

        test('passes props to child FC', () => {
            const w = createWorld();
            let receivedProps: { value: number } | null = null;

            function Child(props: { value: number }) {
                receivedProps = { ...props };
            }

            w.mount(() => {
                useConditionalChild(() => true, Child, { value: 42 });
            });

            w.tick(FIXED_MS);
            expect(receivedProps).toEqual({ value: 42 });
        });

        test('guard is evaluated each fixed tick', () => {
            const w = createWorld();
            let guardCalls = 0;

            w.mount(() => {
                useConditionalChild(
                    () => {
                        guardCalls++;
                        return false;
                    },
                    () => {},
                );
            });

            w.tick(FIXED_MS);
            w.tick(FIXED_MS);
            w.tick(FIXED_MS);
            expect(guardCalls).toBe(3);
        });

        test('does not remount when guard stays true', () => {
            const w = createWorld();
            let childInits = 0;

            function Child() {
                useInit(() => {
                    childInits++;
                });
            }

            w.mount(() => {
                useConditionalChild(() => true, Child);
            });

            w.tick(FIXED_MS);
            w.tick(FIXED_MS);
            w.tick(FIXED_MS);
            expect(childInits).toBe(1);
        });
    });
});
