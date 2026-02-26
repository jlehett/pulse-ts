import { World } from '../world/world';
import { useChild } from './hooks';
import {
    createContext,
    useProvideContext,
    useContext,
    useOptionalContext,
} from './context';

describe('context', () => {
    describe('createContext', () => {
        test('returns a unique context key', () => {
            const ctx1 = createContext<number>('A');
            const ctx2 = createContext<number>('B');
            expect(ctx1._key).not.toBe(ctx2._key);
        });

        test('uses provided name in symbol description', () => {
            const ctx = createContext<number>('MyContext');
            expect(ctx._key.description).toBe('MyContext');
        });

        test('uses default name when none provided', () => {
            const ctx = createContext<number>();
            expect(ctx._key.description).toBe('pulse:context');
        });
    });

    describe('useProvideContext + useContext', () => {
        test('child reads value provided by parent', () => {
            const w = new World();
            const Ctx = createContext<{ value: number }>('Test');
            let received: { value: number } | null = null;

            function Child() {
                received = useContext(Ctx);
            }

            function Parent() {
                useProvideContext(Ctx, { value: 42 });
                useChild(Child);
            }

            w.mount(Parent);
            expect(received).toEqual({ value: 42 });
        });

        test('deeply nested descendant reads ancestor context', () => {
            const w = new World();
            const Ctx = createContext<string>('Deep');
            let received: string | null = null;

            function GrandChild() {
                received = useContext(Ctx);
            }

            function Child() {
                useChild(GrandChild);
            }

            function Root() {
                useProvideContext(Ctx, 'hello');
                useChild(Child);
            }

            w.mount(Root);
            expect(received).toBe('hello');
        });

        test('nearest ancestor provider wins (shadowing)', () => {
            const w = new World();
            const Ctx = createContext<number>('Shadow');
            let received: number | null = null;

            function GrandChild() {
                received = useContext(Ctx);
            }

            function Child() {
                useProvideContext(Ctx, 99);
                useChild(GrandChild);
            }

            function Root() {
                useProvideContext(Ctx, 1);
                useChild(Child);
            }

            w.mount(Root);
            expect(received).toBe(99);
        });

        test('provider on same node is readable', () => {
            const w = new World();
            const Ctx = createContext<number>('Self');
            let received: number | null = null;

            function SelfProvider() {
                useProvideContext(Ctx, 7);
                received = useContext(Ctx);
            }

            w.mount(SelfProvider);
            expect(received).toBe(7);
        });

        test('multiple contexts are independent', () => {
            const w = new World();
            const CtxA = createContext<number>('A');
            const CtxB = createContext<string>('B');
            let numVal: number | null = null;
            let strVal: string | null = null;

            function Child() {
                numVal = useContext(CtxA);
                strVal = useContext(CtxB);
            }

            function Parent() {
                useProvideContext(CtxA, 10);
                useProvideContext(CtxB, 'foo');
                useChild(Child);
            }

            w.mount(Parent);
            expect(numVal).toBe(10);
            expect(strVal).toBe('foo');
        });

        test('mutable objects are shared by reference', () => {
            const w = new World();
            const Ctx = createContext<{ count: number }>('Mutable');
            const state = { count: 0 };
            let received: { count: number } | null = null;

            function Child() {
                received = useContext(Ctx);
            }

            function Parent() {
                useProvideContext(Ctx, state);
                useChild(Child);
            }

            w.mount(Parent);
            expect(received).toBe(state); // same reference
            state.count = 5;
            expect(received!.count).toBe(5); // mutation visible
        });

        test('throws when no provider found', () => {
            const w = new World();
            const Ctx = createContext<number>('Missing');

            function Orphan() {
                useContext(Ctx);
            }

            expect(() => w.mount(Orphan)).toThrow(
                /No provider found for context "Missing"/,
            );
        });

        test('throws with helpful message including context name', () => {
            const w = new World();
            const Ctx = createContext<number>('PlayerScore');

            function Orphan() {
                useContext(Ctx);
            }

            expect(() => w.mount(Orphan)).toThrow('PlayerScore');
            expect(() => w.mount(Orphan)).toThrow('useProvideContext');
        });

        test('sibling subtrees have independent context', () => {
            const w = new World();
            const Ctx = createContext<number>('Sibling');
            const values: number[] = [];

            function Leaf() {
                values.push(useContext(Ctx));
            }

            function BranchA() {
                useProvideContext(Ctx, 1);
                useChild(Leaf);
            }

            function BranchB() {
                useProvideContext(Ctx, 2);
                useChild(Leaf);
            }

            function Root() {
                useChild(BranchA);
                useChild(BranchB);
            }

            w.mount(Root);
            expect(values).toEqual([1, 2]);
        });
    });

    describe('useOptionalContext', () => {
        test('returns value when provider exists', () => {
            const w = new World();
            const Ctx = createContext<number>('Opt');
            let received: number | undefined;

            function Child() {
                received = useOptionalContext(Ctx);
            }

            function Parent() {
                useProvideContext(Ctx, 42);
                useChild(Child);
            }

            w.mount(Parent);
            expect(received).toBe(42);
        });

        test('returns undefined when no provider exists and no default', () => {
            const w = new World();
            const Ctx = createContext<number>('OptMissing');
            let received: number | undefined = 999;

            function Orphan() {
                received = useOptionalContext(Ctx);
            }

            w.mount(Orphan);
            expect(received).toBeUndefined();
        });

        test('returns default value when no provider exists', () => {
            const w = new World();
            const Ctx = createContext<{ dark: boolean }>('Theme', {
                dark: false,
            });
            let received: { dark: boolean } | undefined;

            function Orphan() {
                received = useOptionalContext(Ctx);
            }

            w.mount(Orphan);
            expect(received).toEqual({ dark: false });
        });

        test('provider value takes precedence over default', () => {
            const w = new World();
            const Ctx = createContext<number>('WithDefault', 0);
            let received: number | undefined;

            function Child() {
                received = useOptionalContext(Ctx);
            }

            function Parent() {
                useProvideContext(Ctx, 42);
                useChild(Child);
            }

            w.mount(Parent);
            expect(received).toBe(42);
        });

        test('returns value from self when provider is on same node', () => {
            const w = new World();
            const Ctx = createContext<string>('OptSelf');
            let received: string | undefined;

            function SelfProvider() {
                useProvideContext(Ctx, 'self');
                received = useOptionalContext(Ctx);
            }

            w.mount(SelfProvider);
            expect(received).toBe('self');
        });
    });
});
