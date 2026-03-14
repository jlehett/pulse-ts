import { World } from '@pulse-ts/core';
import { useSequence } from './useSequence';
import type { SequenceHandle, SequenceStep } from './useSequence';

const TICK_MS = 10;

/** Mounts an FC that calls useSequence and returns the handle + step helper. */
function setup(steps: SequenceStep[]) {
    const world = new World({ fixedStepMs: TICK_MS });
    let handle!: SequenceHandle;

    function TestNode() {
        handle = useSequence(steps);
    }

    world.mount(TestNode);

    const step = (count = 1) => {
        for (let i = 0; i < count; i++) world.tick(TICK_MS);
    };

    return { handle, step };
}

// ---------------------------------------------------------------------------
// Sequential steps
// ---------------------------------------------------------------------------

describe('useSequence — sequential steps', () => {
    test('does not advance until play() is called', () => {
        const action = jest.fn();
        const { handle, step } = setup([{ action }]);

        step(10);
        expect(action).not.toHaveBeenCalled();
        expect(handle.finished).toBe(false);
    });

    test('executes a single action step immediately on play', () => {
        const action = jest.fn();
        const { handle, step } = setup([{ action }]);

        handle.play();
        step(1);
        expect(action).toHaveBeenCalledTimes(1);
        expect(handle.finished).toBe(true);
    });

    test('executes multiple steps in order', () => {
        const order: number[] = [];
        const { handle, step } = setup([
            { action: () => order.push(1) },
            { action: () => order.push(2) },
            { action: () => order.push(3) },
        ]);

        handle.play();
        step(1);
        expect(order).toEqual([1, 2, 3]);
        expect(handle.finished).toBe(true);
    });

    test('empty sequence is immediately finished on play', () => {
        const { handle, step } = setup([]);

        handle.play();
        step(1);
        expect(handle.finished).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// Delays (pre/post)
// ---------------------------------------------------------------------------

describe('useSequence — delays', () => {
    test('pre delay waits before calling action', () => {
        const action = jest.fn();
        // pre = 0.05s = 50ms = 5 ticks
        const { handle, step } = setup([{ pre: 0.05, action }]);

        handle.play();
        step(4); // 40ms — not enough
        expect(action).not.toHaveBeenCalled();

        step(1); // 50ms — should fire
        expect(action).toHaveBeenCalledTimes(1);
    });

    test('post delay waits after action before advancing', () => {
        const first = jest.fn();
        const second = jest.fn();
        // post = 0.05s = 50ms = 5 ticks
        // The tick that fires the action also counts toward post,
        // so total ticks = 5 (not 6).
        const { handle, step } = setup([
            { action: first, post: 0.05 },
            { action: second },
        ]);

        handle.play();
        step(1); // first fires immediately, 10ms counts toward post
        expect(first).toHaveBeenCalledTimes(1);
        expect(second).not.toHaveBeenCalled();

        step(3); // 40ms total — not enough post time yet
        expect(second).not.toHaveBeenCalled();

        step(1); // 50ms total — post done, second fires
        expect(second).toHaveBeenCalledTimes(1);
    });

    test('pre + post delays combine correctly', () => {
        const action = jest.fn();
        const after = jest.fn();
        const { handle, step } = setup([
            { pre: 0.03, action, post: 0.02 },
            { action: after },
        ]);

        handle.play();
        step(2); // 20ms — still in pre (need 30ms)
        expect(action).not.toHaveBeenCalled();

        step(1); // 30ms — action fires, starts post
        expect(action).toHaveBeenCalledTimes(1);
        expect(after).not.toHaveBeenCalled();

        step(2); // 50ms — post done, after fires
        expect(after).toHaveBeenCalledTimes(1);
    });

    test('bare delay step (no action) just waits', () => {
        const after = jest.fn();
        const { handle, step } = setup([{ pre: 0.03 }, { action: after }]);

        handle.play();
        step(2);
        expect(after).not.toHaveBeenCalled();

        step(1);
        expect(after).toHaveBeenCalledTimes(1);
    });
});

// ---------------------------------------------------------------------------
// Parallel sub-sequences
// ---------------------------------------------------------------------------

describe('useSequence — parallel', () => {
    test('parallel runs sub-steps concurrently', () => {
        const a = jest.fn();
        const b = jest.fn();
        const { handle, step } = setup([
            {
                parallel: [{ action: a }, { action: b }],
            },
        ]);

        handle.play();
        step(1);
        expect(a).toHaveBeenCalledTimes(1);
        expect(b).toHaveBeenCalledTimes(1);
        expect(handle.finished).toBe(true);
    });

    test('parallel waits for longest sub-sequence', () => {
        const after = jest.fn();
        const { handle, step } = setup([
            {
                parallel: [
                    { action: () => {}, post: 0.02 }, // 20ms
                    { action: () => {}, post: 0.05 }, // 50ms (longest)
                ],
            },
            { action: after },
        ]);

        handle.play();
        step(1); // both actions fire
        step(3); // 40ms total — shorter is done, longer is not
        expect(after).not.toHaveBeenCalled();

        step(2); // 60ms total — both done now
        expect(after).toHaveBeenCalledTimes(1);
    });

    test('parallel with pre delays in sub-steps', () => {
        const a = jest.fn();
        const b = jest.fn();
        const { handle, step } = setup([
            {
                parallel: [
                    { pre: 0.02, action: a },
                    { pre: 0.04, action: b },
                ],
            },
        ]);

        handle.play();
        step(2); // 20ms — a fires
        expect(a).toHaveBeenCalledTimes(1);
        expect(b).not.toHaveBeenCalled();

        step(2); // 40ms — b fires
        expect(b).toHaveBeenCalledTimes(1);
        expect(handle.finished).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// play / reset / finished / elapsed
// ---------------------------------------------------------------------------

describe('useSequence — playback control', () => {
    test('play() restarts a finished sequence', () => {
        const action = jest.fn();
        const { handle, step } = setup([{ action }]);

        handle.play();
        step(1);
        expect(action).toHaveBeenCalledTimes(1);
        expect(handle.finished).toBe(true);

        handle.play();
        step(1);
        expect(action).toHaveBeenCalledTimes(2);
        expect(handle.finished).toBe(true);
    });

    test('play() restarts a playing sequence from the beginning', () => {
        const first = jest.fn();
        const second = jest.fn();
        const { handle, step } = setup([
            { action: first, post: 0.1 },
            { action: second },
        ]);

        handle.play();
        step(1); // first fires
        expect(first).toHaveBeenCalledTimes(1);

        // Restart before post finishes
        handle.play();
        step(1); // first fires again from restart
        expect(first).toHaveBeenCalledTimes(2);
        expect(second).not.toHaveBeenCalled();
    });

    test('reset() stops playback and resets state', () => {
        const action = jest.fn();
        const { handle, step } = setup([{ pre: 0.1, action }]);

        handle.play();
        step(5); // 50ms into pre delay

        handle.reset();
        step(10); // should not advance
        expect(action).not.toHaveBeenCalled();
        expect(handle.finished).toBe(false);
        expect(handle.elapsed).toBe(0);
    });

    test('elapsed tracks time since play()', () => {
        const { handle, step } = setup([{ post: 1.0 }]);

        expect(handle.elapsed).toBe(0);

        handle.play();
        step(10); // 100ms = 0.1s
        expect(handle.elapsed).toBeCloseTo(0.1, 2);

        step(40); // 500ms total = 0.5s
        expect(handle.elapsed).toBeCloseTo(0.5, 2);
    });

    test('elapsed stops incrementing when sequence finishes', () => {
        const { handle, step } = setup([{ post: 0.05 }]);

        handle.play();
        step(10); // 100ms, well past 50ms post
        const e = handle.elapsed;

        step(10); // more time passes
        expect(handle.elapsed).toBe(e);
    });

    test('finished is true only after all steps complete', () => {
        const { handle, step } = setup([{ post: 0.03 }, { post: 0.03 }]);

        handle.play();
        expect(handle.finished).toBe(false);

        step(3); // 30ms — first step done
        expect(handle.finished).toBe(false);

        step(3); // 60ms — second step done
        expect(handle.finished).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// Interface contract
// ---------------------------------------------------------------------------

describe('useSequence — interface', () => {
    test('handle exposes expected interface', () => {
        const { handle } = setup([]);

        expect(typeof handle.play).toBe('function');
        expect(typeof handle.reset).toBe('function');
        expect(typeof handle.finished).toBe('boolean');
        expect(typeof handle.elapsed).toBe('number');
    });
});
