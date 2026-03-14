import { World } from '../world/world';
import { useWatch } from './watch';

// Fixed step = 10ms for easy arithmetic
const FIXED_MS = 10;

function createWorld() {
    return new World({ fixedStepMs: FIXED_MS });
}

describe('useWatch', () => {
    test('fires callback when watched value changes', () => {
        const w = createWorld();
        const state = { round: 1 };
        const calls: Array<[number, number]> = [];

        function Watcher() {
            useWatch(
                () => state.round,
                (val, prev) => calls.push([val, prev]),
            );
        }

        w.mount(Watcher);
        expect(calls).toHaveLength(0); // skip initial

        state.round = 2;
        w.tick(FIXED_MS);
        expect(calls).toEqual([[2, 1]]);

        state.round = 5;
        w.tick(FIXED_MS);
        expect(calls).toEqual([
            [2, 1],
            [5, 2],
        ]);
    });

    test('skips initial value — does not fire on mount', () => {
        const w = createWorld();
        const state = { value: 42 };
        let fired = false;

        function Watcher() {
            useWatch(
                () => state.value,
                () => {
                    fired = true;
                },
            );
        }

        w.mount(Watcher);
        expect(fired).toBe(false);

        // tick without change
        w.tick(FIXED_MS);
        expect(fired).toBe(false);
    });

    test('does not fire when value stays the same', () => {
        const w = createWorld();
        const state = { x: 'hello' };
        let callCount = 0;

        function Watcher() {
            useWatch(
                () => state.x,
                () => {
                    callCount++;
                },
            );
        }

        w.mount(Watcher);
        w.tick(FIXED_MS);
        w.tick(FIXED_MS);
        w.tick(FIXED_MS);
        expect(callCount).toBe(0);
    });

    test('uses strict equality — different object references trigger callback', () => {
        const w = createWorld();
        let obj = { a: 1 };
        const calls: unknown[] = [];

        function Watcher() {
            useWatch(
                () => obj,
                (val) => calls.push(val),
            );
        }

        w.mount(Watcher);
        w.tick(FIXED_MS);
        expect(calls).toHaveLength(0); // same reference

        obj = { a: 1 }; // new reference, same shape
        w.tick(FIXED_MS);
        expect(calls).toHaveLength(1);
    });

    test('defaults to fixed tick evaluation', () => {
        const w = createWorld();
        const state = { v: 0 };
        let fixedFired = false;

        function Watcher() {
            useWatch(
                () => state.v,
                () => {
                    fixedFired = true;
                },
            );
        }

        w.mount(Watcher);
        state.v = 1;
        w.tick(FIXED_MS);
        expect(fixedFired).toBe(true);
    });

    test('kind: frame evaluates in frame update', () => {
        const w = createWorld();
        const state = { v: 0 };
        let frameFired = false;

        function Watcher() {
            useWatch(
                () => state.v,
                () => {
                    frameFired = true;
                },
                { kind: 'frame' },
            );
        }

        w.mount(Watcher);
        state.v = 1;
        w.tick(FIXED_MS);
        expect(frameFired).toBe(true);
    });

    test('callback receives correct new and previous values across multiple changes', () => {
        const w = createWorld();
        const state = { phase: 'menu' as string };
        const transitions: Array<[string, string]> = [];

        function Watcher() {
            useWatch(
                () => state.phase,
                (val, prev) => transitions.push([val, prev]),
            );
        }

        w.mount(Watcher);

        state.phase = 'playing';
        w.tick(FIXED_MS);

        state.phase = 'gameover';
        w.tick(FIXED_MS);

        state.phase = 'menu';
        w.tick(FIXED_MS);

        expect(transitions).toEqual([
            ['playing', 'menu'],
            ['gameover', 'playing'],
            ['menu', 'gameover'],
        ]);
    });

    test('cleanup works — watcher stops after node destroy', () => {
        const w = createWorld();
        const state = { v: 0 };
        let callCount = 0;

        function Watcher() {
            useWatch(
                () => state.v,
                () => {
                    callCount++;
                },
            );
        }

        const node = w.mount(Watcher);

        state.v = 1;
        w.tick(FIXED_MS);
        expect(callCount).toBe(1);

        node.destroy();

        state.v = 2;
        w.tick(FIXED_MS);
        expect(callCount).toBe(1); // no more calls
    });
});
