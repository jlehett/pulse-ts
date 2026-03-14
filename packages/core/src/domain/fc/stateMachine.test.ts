import { World } from '../world/world';
import { useStateMachine } from './stateMachine';
import type { StateMachineHandle } from './stateMachine';

const FIXED_MS = 10;

function createWorld() {
    return new World({ fixedStepMs: FIXED_MS });
}

describe('useStateMachine', () => {
    test('starts in the initial state', () => {
        const w = createWorld();
        let sm!: StateMachineHandle<'idle' | 'running'>;

        w.mount(() => {
            sm = useStateMachine({
                initial: 'idle',
                states: { idle: {}, running: {} },
            });
        });

        expect(sm.current).toBe('idle');
    });

    test('fires onEnter for the initial state', () => {
        const w = createWorld();
        let entered = false;

        w.mount(() => {
            useStateMachine({
                initial: 'idle',
                states: {
                    idle: {
                        onEnter: () => {
                            entered = true;
                        },
                    },
                    running: {},
                },
            });
        });

        expect(entered).toBe(true);
    });

    test('sm.send() transitions and fires onExit/onEnter', () => {
        const w = createWorld();
        const log: string[] = [];
        let sm!: StateMachineHandle<'a' | 'b'>;

        w.mount(() => {
            sm = useStateMachine({
                initial: 'a',
                states: {
                    a: {
                        onExit: () => log.push('exit:a'),
                    },
                    b: {
                        onEnter: () => log.push('enter:b'),
                    },
                },
            });
        });

        log.length = 0; // clear initial onEnter
        sm.send('b');
        expect(sm.current).toBe('b');
        expect(log).toEqual(['exit:a', 'enter:b']);
    });

    test('sm.send() to same state is a no-op', () => {
        const w = createWorld();
        let enterCount = 0;
        let sm!: StateMachineHandle<'a' | 'b'>;

        w.mount(() => {
            sm = useStateMachine({
                initial: 'a',
                states: {
                    a: {
                        onEnter: () => enterCount++,
                    },
                    b: {},
                },
            });
        });

        expect(enterCount).toBe(1); // initial
        sm.send('a');
        expect(enterCount).toBe(1); // no-op
    });

    test('automatic transitions fire when guard is true', () => {
        const w = createWorld();
        const state = { ready: false };
        let sm!: StateMachineHandle<'waiting' | 'go'>;

        w.mount(() => {
            sm = useStateMachine({
                initial: 'waiting',
                states: { waiting: {}, go: {} },
                transitions: [
                    {
                        from: 'waiting',
                        to: 'go',
                        when: () => state.ready,
                    },
                ],
            });
        });

        w.tick(FIXED_MS);
        expect(sm.current).toBe('waiting');

        state.ready = true;
        w.tick(FIXED_MS);
        expect(sm.current).toBe('go');
    });

    test('automatic transitions fire onExit/action/onEnter in order', () => {
        const w = createWorld();
        const log: string[] = [];
        const state = { go: false };

        w.mount(() => {
            useStateMachine({
                initial: 'a',
                states: {
                    a: { onExit: () => log.push('exit:a') },
                    b: { onEnter: () => log.push('enter:b') },
                },
                transitions: [
                    {
                        from: 'a',
                        to: 'b',
                        when: () => state.go,
                        action: () => log.push('action:a->b'),
                    },
                ],
            });
        });

        log.length = 0;
        state.go = true;
        w.tick(FIXED_MS);
        expect(log).toEqual(['exit:a', 'action:a->b', 'enter:b']);
    });

    test('only one transition fires per tick', () => {
        const w = createWorld();
        let sm!: StateMachineHandle<'a' | 'b' | 'c'>;

        w.mount(() => {
            sm = useStateMachine({
                initial: 'a',
                states: { a: {}, b: {}, c: {} },
                transitions: [
                    { from: 'a', to: 'b', when: () => true },
                    { from: 'b', to: 'c', when: () => true },
                ],
            });
        });

        w.tick(FIXED_MS);
        expect(sm.current).toBe('b'); // not 'c' — one per tick

        w.tick(FIXED_MS);
        expect(sm.current).toBe('c'); // now it cascades
    });

    test('from accepts an array of states', () => {
        const w = createWorld();
        const state = { jump: false };
        let sm!: StateMachineHandle<'idle' | 'running' | 'jumping'>;

        w.mount(() => {
            sm = useStateMachine({
                initial: 'idle',
                states: { idle: {}, running: {}, jumping: {} },
                transitions: [
                    {
                        from: ['idle', 'running'],
                        to: 'jumping',
                        when: () => state.jump,
                    },
                ],
            });
        });

        state.jump = true;
        w.tick(FIXED_MS);
        expect(sm.current).toBe('jumping');
    });

    test('from array — transition fires from second listed state', () => {
        const w = createWorld();
        const state = { jump: false };
        let sm!: StateMachineHandle<'idle' | 'running' | 'jumping'>;

        w.mount(() => {
            sm = useStateMachine({
                initial: 'running',
                states: { idle: {}, running: {}, jumping: {} },
                transitions: [
                    {
                        from: ['idle', 'running'],
                        to: 'jumping',
                        when: () => state.jump,
                    },
                ],
            });
        });

        state.jump = true;
        w.tick(FIXED_MS);
        expect(sm.current).toBe('jumping');
    });

    test('onUpdate is called each tick while in a state', () => {
        const w = createWorld();
        const dtValues: number[] = [];

        w.mount(() => {
            useStateMachine({
                initial: 'active',
                states: {
                    active: {
                        onUpdate: (dt) => dtValues.push(dt),
                    },
                },
            });
        });

        w.tick(FIXED_MS);
        w.tick(FIXED_MS);
        w.tick(FIXED_MS);
        expect(dtValues).toHaveLength(3);
        expect(dtValues[0]).toBeCloseTo(FIXED_MS / 1000, 5);
    });

    test('onUpdate runs for the new state after a transition', () => {
        const w = createWorld();
        const log: string[] = [];
        const state = { go: false };

        w.mount(() => {
            useStateMachine({
                initial: 'a',
                states: {
                    a: { onUpdate: () => log.push('update:a') },
                    b: { onUpdate: () => log.push('update:b') },
                },
                transitions: [{ from: 'a', to: 'b', when: () => state.go }],
            });
        });

        w.tick(FIXED_MS);
        expect(log).toEqual(['update:a']);

        state.go = true;
        w.tick(FIXED_MS);
        // After transition, onUpdate runs for state 'b' (not 'a')
        expect(log).toEqual(['update:a', 'update:b']);
    });

    test('declaration-order priority — first matching transition wins', () => {
        const w = createWorld();
        let sm!: StateMachineHandle<'a' | 'b' | 'c'>;

        w.mount(() => {
            sm = useStateMachine({
                initial: 'a',
                states: { a: {}, b: {}, c: {} },
                transitions: [
                    { from: 'a', to: 'b', when: () => true },
                    { from: 'a', to: 'c', when: () => true },
                ],
            });
        });

        w.tick(FIXED_MS);
        expect(sm.current).toBe('b'); // first match wins, not 'c'
    });

    test('cleanup — state machine stops after node destroy', () => {
        const w = createWorld();
        let updateCount = 0;

        const node = w.mount(() => {
            useStateMachine({
                initial: 'a',
                states: {
                    a: {
                        onUpdate: () => updateCount++,
                    },
                },
            });
        });

        w.tick(FIXED_MS);
        expect(updateCount).toBe(1);

        node.destroy();
        w.tick(FIXED_MS);
        expect(updateCount).toBe(1); // no more updates
    });

    test('works with no transitions defined', () => {
        const w = createWorld();
        let updateCount = 0;

        w.mount(() => {
            useStateMachine({
                initial: 'only',
                states: {
                    only: {
                        onUpdate: () => updateCount++,
                    },
                },
            });
        });

        w.tick(FIXED_MS);
        w.tick(FIXED_MS);
        expect(updateCount).toBe(2);
    });
});
