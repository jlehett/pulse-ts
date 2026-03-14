import { World } from '../world/world';
import { useChild } from './hooks';
import { defineStore, useStore } from './stores';

describe('stores', () => {
    describe('defineStore', () => {
        test('returns a store definition with a unique key', () => {
            const storeA = defineStore('a', () => ({ x: 1 }));
            const storeB = defineStore('b', () => ({ x: 2 }));
            expect(storeA._key).not.toBe(storeB._key);
        });

        test('uses provided name in symbol description', () => {
            const store = defineStore('myStore', () => ({}));
            expect(store._key.description).toBe('myStore');
        });
    });

    describe('useStore', () => {
        test('returns state created by the factory', () => {
            const w = new World();
            const Store = defineStore('test', () => ({ count: 0 }));
            let state: { count: number } | null = null;

            function Reader() {
                const [s] = useStore(Store);
                state = s;
            }

            w.mount(Reader);
            expect(state).toEqual({ count: 0 });
        });

        test('store is singleton per world — same reference across nodes', () => {
            const w = new World();
            const Store = defineStore('shared', () => ({ value: 42 }));
            const refs: Array<{ value: number }> = [];

            function NodeA() {
                const [s] = useStore(Store);
                refs.push(s);
            }

            function NodeB() {
                const [s] = useStore(Store);
                refs.push(s);
            }

            function Root() {
                useChild(NodeA);
                useChild(NodeB);
            }

            w.mount(Root);
            expect(refs).toHaveLength(2);
            expect(refs[0]).toBe(refs[1]); // same reference
        });

        test('factory is called only once per world (lazy creation)', () => {
            const w = new World();
            let factoryCallCount = 0;
            const Store = defineStore('lazy', () => {
                factoryCallCount++;
                return { n: 0 };
            });

            function NodeA() {
                useStore(Store);
            }

            function NodeB() {
                useStore(Store);
            }

            function Root() {
                useChild(NodeA);
                useChild(NodeB);
            }

            w.mount(Root);
            expect(factoryCallCount).toBe(1);
        });

        test('setState with partial object performs shallow merge', () => {
            const w = new World();
            const Store = defineStore('partial', () => ({ a: 1, b: 'hello' }));
            let state: { a: number; b: string } | null = null;
            let setter:
                | ((u: Partial<{ a: number; b: string }>) => void)
                | null = null;

            function Writer() {
                const [s, set] = useStore(Store);
                state = s;
                setter = set;
            }

            w.mount(Writer);
            expect(state).toEqual({ a: 1, b: 'hello' });

            setter!({ a: 99 });
            expect(state).toEqual({ a: 99, b: 'hello' });
        });

        test('setState with updater function receives previous state', () => {
            const w = new World();
            const Store = defineStore('updater', () => ({ count: 0 }));
            type S = { count: number };
            let setter:
                | ((u: Partial<S> | ((prev: S) => Partial<S>)) => void)
                | null = null;
            let state: S | null = null;

            function Writer() {
                const [s, set] = useStore(Store);
                state = s;
                setter = set;
            }

            w.mount(Writer);
            setter!((prev) => ({ count: prev.count + 10 }));
            expect(state!.count).toBe(10);

            setter!((prev) => ({ count: prev.count + 5 }));
            expect(state!.count).toBe(15);
        });

        test('mutations via setState are visible to all consumers', () => {
            const w = new World();
            const Store = defineStore('visible', () => ({ score: 0 }));
            type S = { score: number };
            let writerSetter: ((u: Partial<S>) => void) | null = null;
            let readerState: S | null = null;

            function Writer() {
                const [, set] = useStore(Store);
                writerSetter = set;
            }

            function Reader() {
                const [s] = useStore(Store);
                readerState = s;
            }

            function Root() {
                useChild(Writer);
                useChild(Reader);
            }

            w.mount(Root);
            expect(readerState!.score).toBe(0);

            writerSetter!({ score: 42 });
            expect(readerState!.score).toBe(42); // same reference, mutation visible
        });

        test('different stores are independent', () => {
            const w = new World();
            const StoreA = defineStore('a', () => ({ x: 1 }));
            const StoreB = defineStore('b', () => ({ y: 'hello' }));
            let stateA: { x: number } | null = null;
            let stateB: { y: string } | null = null;

            function Reader() {
                const [a] = useStore(StoreA);
                const [b] = useStore(StoreB);
                stateA = a;
                stateB = b;
            }

            w.mount(Reader);
            expect(stateA).toEqual({ x: 1 });
            expect(stateB).toEqual({ y: 'hello' });
        });

        test('different worlds get independent store instances', () => {
            const Store = defineStore('perWorld', () => ({ n: 0 }));
            const w1 = new World();
            const w2 = new World();
            let state1: { n: number } | null = null;
            let state2: { n: number } | null = null;
            let setter1: ((u: Partial<{ n: number }>) => void) | null = null;

            function Node1() {
                const [s, set] = useStore(Store);
                state1 = s;
                setter1 = set;
            }

            function Node2() {
                const [s] = useStore(Store);
                state2 = s;
            }

            w1.mount(Node1);
            w2.mount(Node2);

            expect(state1).not.toBe(state2); // different instances
            setter1!({ n: 99 });
            expect(state1!.n).toBe(99);
            expect(state2!.n).toBe(0); // unaffected
        });
    });

    describe('cleanup on world destroy', () => {
        test('stores are cleared when world is destroyed', () => {
            const Store = defineStore('cleanup', () => ({ v: 1 }));
            const w = new World();
            let state1: { v: number } | null = null;

            function Reader() {
                const [s] = useStore(Store);
                state1 = s;
            }

            w.mount(Reader);
            expect(state1!.v).toBe(1);

            w.destroy();

            // Mount on a new world — should get a fresh instance
            const w2 = new World();
            let state2: { v: number } | null = null;

            function Reader2() {
                const [s] = useStore(Store);
                state2 = s;
            }

            w2.mount(Reader2);
            expect(state2).not.toBe(state1);
            expect(state2!.v).toBe(1); // fresh from factory
        });

        test('factory is called again for a new world after previous was destroyed', () => {
            let factoryCallCount = 0;
            const Store = defineStore('recount', () => {
                factoryCallCount++;
                return { x: 0 };
            });

            const w1 = new World();
            function N() {
                useStore(Store);
            }
            w1.mount(N);
            expect(factoryCallCount).toBe(1);

            w1.destroy();

            const w2 = new World();
            w2.mount(N);
            expect(factoryCallCount).toBe(2);
        });
    });
});
