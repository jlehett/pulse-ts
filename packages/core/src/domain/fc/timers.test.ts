import { World } from '../world/world';
import type { TimerHandle, CooldownHandle } from './timers';
import { useTimer, useCooldown } from './timers';

// Fixed step = 10ms = 0.01s for easy arithmetic
const FIXED_MS = 10;

function createWorld() {
    return new World({ fixedStepMs: FIXED_MS });
}

describe('useTimer', () => {
    test('starts inactive with elapsed=0 and paused=false', () => {
        const w = createWorld();
        let h!: TimerHandle;
        w.mount(() => {
            h = useTimer(1);
        });
        expect(h.active).toBe(false);
        expect(h.paused).toBe(false);
        expect(h.elapsed).toBe(0);
        expect(h.remaining).toBe(1);
    });

    test('does not tick when inactive', () => {
        const w = createWorld();
        let h!: TimerHandle;
        w.mount(() => {
            h = useTimer(0.1);
        });
        w.tick(FIXED_MS * 5);
        expect(h.active).toBe(false);
        expect(h.elapsed).toBe(0);
    });

    test('start() begins counting and deactivates when elapsed reaches duration', () => {
        const w = createWorld();
        let h!: TimerHandle;
        w.mount(() => {
            h = useTimer(0.05); // 50ms = 5 fixed steps
        });
        h.start();
        expect(h.active).toBe(true);

        // After 3 steps (30ms = 0.03s), still active
        w.tick(FIXED_MS * 3);
        expect(h.active).toBe(true);
        expect(h.elapsed).toBeCloseTo(0.03, 5);
        expect(h.remaining).toBeCloseTo(0.02, 5);

        // After 2 more steps (total 50ms = 0.05s), should complete
        w.tick(FIXED_MS * 2);
        expect(h.active).toBe(false);
        expect(h.elapsed).toBeCloseTo(0.05, 5);
        expect(h.remaining).toBeCloseTo(0, 5);
    });

    test('start() is a no-op when already active', () => {
        const w = createWorld();
        let h!: TimerHandle;
        w.mount(() => {
            h = useTimer(0.1);
        });
        h.start();
        w.tick(FIXED_MS * 3); // elapsed = 0.03
        h.start(); // should not reset elapsed
        expect(h.elapsed).toBeCloseTo(0.03, 5);
    });

    test('cancel() stops ticking and resets elapsed to 0', () => {
        const w = createWorld();
        let h!: TimerHandle;
        w.mount(() => {
            h = useTimer(0.1);
        });
        h.start();
        w.tick(FIXED_MS * 3);
        expect(h.elapsed).toBeCloseTo(0.03, 5);

        h.cancel();
        expect(h.active).toBe(false);
        expect(h.elapsed).toBe(0);
        expect(h.paused).toBe(false);

        // Should not tick after cancel
        w.tick(FIXED_MS * 3);
        expect(h.elapsed).toBe(0);
    });

    test('reset() clears elapsed and restarts', () => {
        const w = createWorld();
        let h!: TimerHandle;
        w.mount(() => {
            h = useTimer(0.05);
        });
        h.start();
        w.tick(FIXED_MS * 3); // elapsed = 0.03
        h.reset();
        expect(h.active).toBe(true);
        expect(h.elapsed).toBe(0);

        // Should count from 0 again
        w.tick(FIXED_MS * 5);
        expect(h.active).toBe(false);
        expect(h.elapsed).toBeCloseTo(0.05, 5);
    });

    test('pause() freezes elapsed; resume() continues from where it left off', () => {
        const w = createWorld();
        let h!: TimerHandle;
        w.mount(() => {
            h = useTimer(0.1);
        });
        h.start();
        w.tick(FIXED_MS * 3); // elapsed = 0.03
        h.pause();
        expect(h.paused).toBe(true);
        expect(h.active).toBe(true);

        // Ticking while paused does not advance elapsed
        w.tick(FIXED_MS * 5);
        expect(h.elapsed).toBeCloseTo(0.03, 5);

        h.resume();
        expect(h.paused).toBe(false);

        // Should continue from 0.03
        w.tick(FIXED_MS * 3); // elapsed = 0.06
        expect(h.elapsed).toBeCloseTo(0.06, 5);
    });

    test('pause() is a no-op when not active', () => {
        const w = createWorld();
        let h!: TimerHandle;
        w.mount(() => {
            h = useTimer(0.1);
        });
        h.pause();
        expect(h.paused).toBe(false);
    });

    test('pause() is a no-op when already paused', () => {
        const w = createWorld();
        let h!: TimerHandle;
        w.mount(() => {
            h = useTimer(0.1);
        });
        h.start();
        h.pause();
        expect(h.paused).toBe(true);
        h.pause(); // second call is a no-op
        expect(h.paused).toBe(true);
    });

    test('resume() is a no-op when not paused', () => {
        const w = createWorld();
        let h!: TimerHandle;
        w.mount(() => {
            h = useTimer(0.1);
        });
        h.start();
        h.resume(); // not paused, should be no-op
        expect(h.paused).toBe(false);
        expect(h.active).toBe(true);
    });

    test('elapsed is clamped to duration', () => {
        const w = createWorld();
        let h!: TimerHandle;
        w.mount(() => {
            h = useTimer(0.02); // 2 fixed steps
        });
        h.start();
        // Tick way past the duration
        w.tick(FIXED_MS * 10);
        expect(h.elapsed).toBeCloseTo(0.02, 5);
        expect(h.remaining).toBeCloseTo(0, 5);
    });

    test('multiple timers on the same node work independently', () => {
        const w = createWorld();
        let a!: TimerHandle;
        let b!: TimerHandle;
        w.mount(() => {
            a = useTimer(0.05);
            b = useTimer(0.1);
        });
        a.start();
        b.start();
        w.tick(FIXED_MS * 5); // 0.05s — a completes, b still active
        expect(a.active).toBe(false);
        expect(b.active).toBe(true);
        expect(b.elapsed).toBeCloseTo(0.05, 5);

        w.tick(FIXED_MS * 6); // overshoot to avoid float accumulation edge
        expect(b.active).toBe(false);
        expect(b.elapsed).toBeCloseTo(0.1, 5);
    });

    test('onComplete fires once when timer expires', () => {
        const w = createWorld();
        const onComplete = jest.fn();
        let h!: TimerHandle;
        w.mount(() => {
            h = useTimer(0.03, { onComplete }); // 3 fixed steps
        });
        h.reset();
        w.tick(FIXED_MS * 2); // not yet complete
        expect(onComplete).not.toHaveBeenCalled();

        w.tick(FIXED_MS * 1); // completes at step 3
        expect(onComplete).toHaveBeenCalledTimes(1);

        // Extra ticks should not fire again
        w.tick(FIXED_MS * 3);
        expect(onComplete).toHaveBeenCalledTimes(1);
    });

    test('onComplete fires exactly once per reset() cycle', () => {
        const w = createWorld();
        const onComplete = jest.fn();
        let h!: TimerHandle;
        w.mount(() => {
            h = useTimer(0.02, { onComplete }); // 2 fixed steps
        });

        // First cycle
        h.reset();
        w.tick(FIXED_MS * 2);
        expect(onComplete).toHaveBeenCalledTimes(1);

        // Second cycle
        h.reset();
        w.tick(FIXED_MS * 2);
        expect(onComplete).toHaveBeenCalledTimes(2);
    });

    test('onTick fires each tick while active with (remaining, elapsed)', () => {
        const w = createWorld();
        const onTick = jest.fn();
        let h!: TimerHandle;
        w.mount(() => {
            h = useTimer(0.03, { onTick }); // 3 fixed steps
        });
        h.reset();

        w.tick(FIXED_MS * 1); // tick 1: elapsed=0.01, remaining=0.02
        expect(onTick).toHaveBeenCalledTimes(1);
        expect(onTick.mock.calls[0]![0]).toBeCloseTo(0.02, 5); // remaining
        expect(onTick.mock.calls[0]![1]).toBeCloseTo(0.01, 5); // elapsed

        w.tick(FIXED_MS * 1); // tick 2: elapsed=0.02, remaining=0.01
        expect(onTick).toHaveBeenCalledTimes(2);
        expect(onTick.mock.calls[1]![0]).toBeCloseTo(0.01, 5);
        expect(onTick.mock.calls[1]![1]).toBeCloseTo(0.02, 5);

        // tick 3: completion tick — onTick still fires
        w.tick(FIXED_MS * 1);
        expect(onTick).toHaveBeenCalledTimes(3);
        expect(onTick.mock.calls[2]![0]).toBeCloseTo(0, 5);
        expect(onTick.mock.calls[2]![1]).toBeCloseTo(0.03, 5);

        // After completion, no more ticks
        w.tick(FIXED_MS * 2);
        expect(onTick).toHaveBeenCalledTimes(3);
    });

    test('onTick does not fire when paused', () => {
        const w = createWorld();
        const onTick = jest.fn();
        let h!: TimerHandle;
        w.mount(() => {
            h = useTimer(0.1, { onTick });
        });
        h.reset();
        w.tick(FIXED_MS * 1);
        expect(onTick).toHaveBeenCalledTimes(1);

        h.pause();
        w.tick(FIXED_MS * 3);
        expect(onTick).toHaveBeenCalledTimes(1); // no additional calls

        h.resume();
        w.tick(FIXED_MS * 1);
        expect(onTick).toHaveBeenCalledTimes(2);
    });

    test('onComplete does not fire when cancelled', () => {
        const w = createWorld();
        const onComplete = jest.fn();
        let h!: TimerHandle;
        w.mount(() => {
            h = useTimer(0.03, { onComplete });
        });
        h.reset();
        w.tick(FIXED_MS * 2);
        h.cancel();
        w.tick(FIXED_MS * 5);
        expect(onComplete).not.toHaveBeenCalled();
    });

    test('works without options (backward compatible)', () => {
        const w = createWorld();
        let h!: TimerHandle;
        w.mount(() => {
            h = useTimer(0.02);
        });
        h.reset();
        w.tick(FIXED_MS * 2);
        expect(h.active).toBe(false);
        expect(h.elapsed).toBeCloseTo(0.02, 5);
    });
});

describe('useCooldown', () => {
    test('starts ready with remaining=0 and paused=false', () => {
        const w = createWorld();
        let h!: CooldownHandle;
        w.mount(() => {
            h = useCooldown(1);
        });
        expect(h.ready).toBe(true);
        expect(h.paused).toBe(false);
        expect(h.remaining).toBe(0);
    });

    test('trigger() sets ready=false; after duration elapses, ready becomes true', () => {
        const w = createWorld();
        let h!: CooldownHandle;
        w.mount(() => {
            h = useCooldown(0.05); // 50ms = 5 fixed steps
        });
        h.trigger();
        expect(h.ready).toBe(false);
        expect(h.remaining).toBeCloseTo(0.05, 5);

        // After 3 steps, still cooling down
        w.tick(FIXED_MS * 3);
        expect(h.ready).toBe(false);
        expect(h.remaining).toBeCloseTo(0.02, 5);

        // After 2 more steps, ready again
        w.tick(FIXED_MS * 2);
        expect(h.ready).toBe(true);
        expect(h.remaining).toBeCloseTo(0, 5);
    });

    test('trigger() is a no-op when already cooling down', () => {
        const w = createWorld();
        let h!: CooldownHandle;
        w.mount(() => {
            h = useCooldown(0.1);
        });
        h.trigger();
        w.tick(FIXED_MS * 3); // remaining ≈ 0.07
        const remainingBefore = h.remaining;
        h.trigger(); // should be a no-op
        expect(h.remaining).toBeCloseTo(remainingBefore, 5);
    });

    test('reset() immediately sets ready=true', () => {
        const w = createWorld();
        let h!: CooldownHandle;
        w.mount(() => {
            h = useCooldown(1);
        });
        h.trigger();
        expect(h.ready).toBe(false);
        h.reset();
        expect(h.ready).toBe(true);
        expect(h.remaining).toBe(0);
        expect(h.paused).toBe(false);
    });

    test('pause() freezes remaining; resume() continues countdown', () => {
        const w = createWorld();
        let h!: CooldownHandle;
        w.mount(() => {
            h = useCooldown(0.1);
        });
        h.trigger();
        w.tick(FIXED_MS * 3); // remaining ≈ 0.07
        h.pause();
        expect(h.paused).toBe(true);

        // Ticking while paused does not change remaining
        w.tick(FIXED_MS * 5);
        expect(h.remaining).toBeCloseTo(0.07, 5);

        h.resume();
        expect(h.paused).toBe(false);

        // Should continue counting down from 0.07
        w.tick(FIXED_MS * 3); // remaining ≈ 0.04
        expect(h.remaining).toBeCloseTo(0.04, 5);
    });

    test('pause() is a no-op when ready', () => {
        const w = createWorld();
        let h!: CooldownHandle;
        w.mount(() => {
            h = useCooldown(1);
        });
        h.pause();
        expect(h.paused).toBe(false);
    });

    test('pause() is a no-op when already paused', () => {
        const w = createWorld();
        let h!: CooldownHandle;
        w.mount(() => {
            h = useCooldown(1);
        });
        h.trigger();
        h.pause();
        expect(h.paused).toBe(true);
        h.pause(); // second call
        expect(h.paused).toBe(true);
    });

    test('resume() is a no-op when not paused', () => {
        const w = createWorld();
        let h!: CooldownHandle;
        w.mount(() => {
            h = useCooldown(1);
        });
        h.trigger();
        h.resume(); // not paused
        expect(h.paused).toBe(false);
    });

    test('multiple cooldowns on the same node work independently', () => {
        const w = createWorld();
        let a!: CooldownHandle;
        let b!: CooldownHandle;
        w.mount(() => {
            a = useCooldown(0.05);
            b = useCooldown(0.1);
        });
        a.trigger();
        b.trigger();
        w.tick(FIXED_MS * 5); // 0.05s — a ready, b still cooling
        expect(a.ready).toBe(true);
        expect(b.ready).toBe(false);

        w.tick(FIXED_MS * 6); // overshoot to avoid float accumulation edge
        expect(b.ready).toBe(true);
    });

    test('onReady fires once when cooldown becomes ready', () => {
        const w = createWorld();
        const onReady = jest.fn();
        let h!: CooldownHandle;
        w.mount(() => {
            h = useCooldown(0.03, { onReady }); // 3 fixed steps
        });
        h.trigger();
        w.tick(FIXED_MS * 2); // not yet ready
        expect(onReady).not.toHaveBeenCalled();

        w.tick(FIXED_MS * 1); // ready at step 3
        expect(onReady).toHaveBeenCalledTimes(1);

        // Extra ticks should not fire again
        w.tick(FIXED_MS * 3);
        expect(onReady).toHaveBeenCalledTimes(1);
    });

    test('onReady fires again after re-trigger', () => {
        const w = createWorld();
        const onReady = jest.fn();
        let h!: CooldownHandle;
        w.mount(() => {
            h = useCooldown(0.02, { onReady }); // 2 fixed steps
        });

        // First cycle
        h.trigger();
        w.tick(FIXED_MS * 2);
        expect(onReady).toHaveBeenCalledTimes(1);

        // Second cycle
        h.trigger();
        w.tick(FIXED_MS * 2);
        expect(onReady).toHaveBeenCalledTimes(2);
    });

    test('onProgress fires each tick while cooling down with (remaining, duration)', () => {
        const w = createWorld();
        const onProgress = jest.fn();
        let h!: CooldownHandle;
        w.mount(() => {
            h = useCooldown(0.03, { onProgress }); // 3 fixed steps
        });
        h.trigger();

        w.tick(FIXED_MS * 1); // tick 1: remaining=0.02
        expect(onProgress).toHaveBeenCalledTimes(1);
        expect(onProgress.mock.calls[0]![0]).toBeCloseTo(0.02, 5); // remaining
        expect(onProgress.mock.calls[0]![1]).toBeCloseTo(0.03, 5); // duration

        w.tick(FIXED_MS * 1); // tick 2: remaining=0.01
        expect(onProgress).toHaveBeenCalledTimes(2);
        expect(onProgress.mock.calls[1]![0]).toBeCloseTo(0.01, 5);
        expect(onProgress.mock.calls[1]![1]).toBeCloseTo(0.03, 5);

        // tick 3: completion tick — onProgress still fires with remaining=0
        w.tick(FIXED_MS * 1);
        expect(onProgress).toHaveBeenCalledTimes(3);
        expect(onProgress.mock.calls[2]![0]).toBeCloseTo(0, 5);
        expect(onProgress.mock.calls[2]![1]).toBeCloseTo(0.03, 5);

        // After ready, no more progress calls
        w.tick(FIXED_MS * 2);
        expect(onProgress).toHaveBeenCalledTimes(3);
    });

    test('onProgress does not fire when paused', () => {
        const w = createWorld();
        const onProgress = jest.fn();
        let h!: CooldownHandle;
        w.mount(() => {
            h = useCooldown(0.1, { onProgress });
        });
        h.trigger();
        w.tick(FIXED_MS * 1);
        expect(onProgress).toHaveBeenCalledTimes(1);

        h.pause();
        w.tick(FIXED_MS * 3);
        expect(onProgress).toHaveBeenCalledTimes(1); // no additional calls

        h.resume();
        w.tick(FIXED_MS * 1);
        expect(onProgress).toHaveBeenCalledTimes(2);
    });

    test('onReady does not fire on manual reset()', () => {
        const w = createWorld();
        const onReady = jest.fn();
        let h!: CooldownHandle;
        w.mount(() => {
            h = useCooldown(0.1, { onReady });
        });
        h.trigger();
        w.tick(FIXED_MS * 2);
        h.reset(); // manually reset — should NOT fire onReady
        expect(onReady).not.toHaveBeenCalled();
    });

    test('works without options (backward compatible)', () => {
        const w = createWorld();
        let h!: CooldownHandle;
        w.mount(() => {
            h = useCooldown(0.02);
        });
        h.trigger();
        w.tick(FIXED_MS * 2);
        expect(h.ready).toBe(true);
        expect(h.remaining).toBeCloseTo(0, 5);
    });
});
