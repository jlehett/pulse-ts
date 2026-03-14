import { World } from '@pulse-ts/core';
import { useAnimate } from './useAnimate';
import type { AnimatedValue, AnimateOptions } from './useAnimate';

const TICK_MS = 10;

/**
 * Helper: mounts an FC that calls useAnimate and returns the handle +
 * a step function to advance the world.
 */
function setup(options: AnimateOptions) {
    const world = new World({ fixedStepMs: TICK_MS });
    let handle!: AnimatedValue;

    function TestNode() {
        handle = useAnimate(options);
    }

    world.mount(TestNode);

    const step = (steps = 1) => {
        for (let i = 0; i < steps; i++) world.tick(TICK_MS);
    };

    return { handle, step };
}

// ---------------------------------------------------------------------------
// Oscillation — amplitude mode
// ---------------------------------------------------------------------------

describe('useAnimate — oscillation (amplitude)', () => {
    test('sine wave oscillates within amplitude bounds', () => {
        const { handle, step } = setup({
            wave: 'sine',
            amplitude: 0.5,
            frequency: 2,
        });

        const values: number[] = [];
        for (let i = 0; i < 500; i++) {
            step();
            values.push(handle.value);
        }

        expect(Math.max(...values)).toBeLessThanOrEqual(0.5 + 0.001);
        expect(Math.min(...values)).toBeGreaterThanOrEqual(-0.5 - 0.001);
        // Should cross zero (oscillate both positive and negative)
        expect(values.some((v) => v > 0.1)).toBe(true);
        expect(values.some((v) => v < -0.1)).toBe(true);
    });

    test('triangle wave oscillates within amplitude bounds', () => {
        const { handle, step } = setup({
            wave: 'triangle',
            amplitude: 1.0,
            frequency: 4,
        });

        const values: number[] = [];
        for (let i = 0; i < 300; i++) {
            step();
            values.push(handle.value);
        }

        expect(Math.max(...values)).toBeLessThanOrEqual(1.0 + 0.01);
        expect(Math.min(...values)).toBeGreaterThanOrEqual(-1.0 - 0.01);
        expect(values.some((v) => v > 0.5)).toBe(true);
        expect(values.some((v) => v < -0.5)).toBe(true);
    });

    test('square wave produces only +amplitude or -amplitude', () => {
        const { handle, step } = setup({
            wave: 'square',
            amplitude: 3,
            frequency: 2,
        });

        const values = new Set<number>();
        for (let i = 0; i < 500; i++) {
            step();
            values.add(handle.value);
        }

        // Square wave should only produce two distinct values
        expect(values.size).toBe(2);
        expect(values.has(3)).toBe(true);
        expect(values.has(-3)).toBe(true);
    });

    test('sawtooth wave ramps within amplitude bounds', () => {
        const { handle, step } = setup({
            wave: 'sawtooth',
            amplitude: 2,
            frequency: 4,
        });

        const values: number[] = [];
        for (let i = 0; i < 300; i++) {
            step();
            values.push(handle.value);
        }

        expect(Math.max(...values)).toBeLessThanOrEqual(2.0 + 0.1);
        expect(Math.min(...values)).toBeGreaterThanOrEqual(-2.0 - 0.1);
    });

    test('amplitude=0 always returns 0', () => {
        const { handle, step } = setup({
            wave: 'sine',
            amplitude: 0,
            frequency: 5,
        });

        step(100);
        expect(handle.value).toBeCloseTo(0);
    });

    test('reset resets elapsed to zero', () => {
        const { handle, step } = setup({
            wave: 'sine',
            amplitude: 1,
            frequency: 2,
        });

        step(50);
        const v1 = handle.value;
        expect(v1).not.toBe(0);

        handle.reset();
        expect(handle.value).toBe(0);
    });
});

// ---------------------------------------------------------------------------
// Oscillation — min/max range mode
// ---------------------------------------------------------------------------

describe('useAnimate — oscillation (min/max)', () => {
    test('sine wave oscillates between min and max', () => {
        const { handle, step } = setup({
            wave: 'sine',
            min: 0.3,
            max: 0.9,
            frequency: 3,
        });

        const values: number[] = [];
        for (let i = 0; i < 500; i++) {
            step();
            values.push(handle.value);
        }

        expect(Math.min(...values)).toBeGreaterThanOrEqual(0.3 - 0.001);
        expect(Math.max(...values)).toBeLessThanOrEqual(0.9 + 0.001);
        // Should span most of the range
        expect(values.some((v) => v > 0.85)).toBe(true);
        expect(values.some((v) => v < 0.35)).toBe(true);
    });

    test('min/max range is exact for square wave', () => {
        const { handle, step } = setup({
            wave: 'square',
            min: 10,
            max: 20,
            frequency: 2,
        });

        const values = new Set<number>();
        for (let i = 0; i < 500; i++) {
            step();
            values.add(handle.value);
        }

        expect(values.size).toBe(2);
        expect(values.has(20)).toBe(true); // (1+1)/2 * 10 + 10 = 20
        expect(values.has(10)).toBe(true); // (-1+1)/2 * 10 + 10 = 10
    });

    test('initial value is min before first tick', () => {
        const { handle } = setup({
            wave: 'sine',
            min: 5,
            max: 15,
            frequency: 1,
        });

        expect(handle.value).toBe(5);
    });
});

// ---------------------------------------------------------------------------
// Rate mode
// ---------------------------------------------------------------------------

describe('useAnimate — rate mode', () => {
    test('value increases linearly with time', () => {
        const { handle, step } = setup({ rate: 2 });

        step(100); // 100 × 10ms = 1s
        expect(handle.value).toBeCloseTo(2.0, 1);

        step(100); // 2s total
        expect(handle.value).toBeCloseTo(4.0, 1);
    });

    test('rate=0 keeps value at 0', () => {
        const { handle, step } = setup({ rate: 0 });

        step(100);
        expect(handle.value).toBe(0);
    });

    test('negative rate decreases value', () => {
        const { handle, step } = setup({ rate: -3 });

        step(100); // 1s
        expect(handle.value).toBeCloseTo(-3.0, 1);
    });

    test('reset resets value to 0', () => {
        const { handle, step } = setup({ rate: 5 });

        step(50);
        expect(handle.value).toBeGreaterThan(0);

        handle.reset();
        expect(handle.value).toBe(0);
    });

    test('finished is always false', () => {
        const { handle, step } = setup({ rate: 1 });

        step(1000);
        expect(handle.finished).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// Tween mode
// ---------------------------------------------------------------------------

describe('useAnimate — tween mode', () => {
    test('starts at from value and does not advance until play()', () => {
        const { handle, step } = setup({
            from: 0,
            to: 10,
            duration: 1,
        });

        step(50); // 0.5s without play
        expect(handle.value).toBe(0);
        expect(handle.finished).toBe(false);
    });

    test('interpolates from→to over duration after play()', () => {
        const { handle, step } = setup({
            from: 0,
            to: 10,
            duration: 1,
        });

        handle.play();
        step(50); // 0.5s → should be ~5
        expect(handle.value).toBeCloseTo(5, 0);

        step(60); // 1.1s total → should be clamped at 10
        expect(handle.value).toBe(10);
        expect(handle.finished).toBe(true);
    });

    test('ease-in starts slow', () => {
        const { handle: linear, step: stepLinear } = setup({
            from: 0,
            to: 100,
            duration: 1,
            easing: 'linear',
        });

        const { handle: easeIn, step: stepEaseIn } = setup({
            from: 0,
            to: 100,
            duration: 1,
            easing: 'ease-in',
        });

        linear.play();
        easeIn.play();

        // After 0.3s
        stepLinear(30);
        stepEaseIn(30);

        // Ease-in should be behind linear at the start
        expect(easeIn.value).toBeLessThan(linear.value);
    });

    test('ease-out starts fast', () => {
        const { handle: linear, step: stepLinear } = setup({
            from: 0,
            to: 100,
            duration: 1,
            easing: 'linear',
        });

        const { handle: easeOut, step: stepEaseOut } = setup({
            from: 0,
            to: 100,
            duration: 1,
            easing: 'ease-out',
        });

        linear.play();
        easeOut.play();

        stepLinear(30);
        stepEaseOut(30);

        // Ease-out should be ahead of linear at the start
        expect(easeOut.value).toBeGreaterThan(linear.value);
    });

    test('custom easing function is used', () => {
        const cubicIn = jest.fn((t: number) => t * t * t);
        const { handle, step } = setup({
            from: 0,
            to: 1,
            duration: 1,
            easing: cubicIn,
        });

        handle.play();
        step(50);

        expect(cubicIn).toHaveBeenCalled();
        // At t=0.5, cubic-in gives 0.125
        expect(handle.value).toBeCloseTo(0.125, 1);
    });

    test('reset returns to initial state', () => {
        const { handle, step } = setup({
            from: 5,
            to: 15,
            duration: 0.5,
        });

        handle.play();
        step(60); // 0.6s → done
        expect(handle.finished).toBe(true);
        expect(handle.value).toBe(15);

        handle.reset();
        expect(handle.value).toBe(5);
        expect(handle.finished).toBe(false);
    });

    test('play() after reset restarts the tween', () => {
        const { handle, step } = setup({
            from: 0,
            to: 10,
            duration: 0.5,
        });

        handle.play();
        step(60); // done
        expect(handle.finished).toBe(true);

        handle.reset();
        handle.play();
        step(25); // 0.25s → halfway
        expect(handle.value).toBeCloseTo(5, 0);
        expect(handle.finished).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// Play callback
// ---------------------------------------------------------------------------

describe('useAnimate — play callback', () => {
    test('tween mode: callback is invoked each frame with current value', () => {
        const { handle, step } = setup({
            from: 0,
            to: 10,
            duration: 1,
        });

        const values: number[] = [];
        handle.play((v) => values.push(v));

        step(50); // 0.5s
        expect(values.length).toBe(50);
        expect(values[values.length - 1]).toBeCloseTo(5, 0);
    });

    test('tween mode: play() without callback still works', () => {
        const { handle, step } = setup({
            from: 0,
            to: 10,
            duration: 1,
        });

        handle.play();
        step(50);
        expect(handle.value).toBeCloseTo(5, 0);
    });

    test('tween mode: callback stops after tween finishes', () => {
        const { handle, step } = setup({
            from: 0,
            to: 10,
            duration: 0.5,
        });

        const values: number[] = [];
        handle.play((v) => values.push(v));

        step(60); // 0.6s — tween is 0.5s, so it should finish
        const countAtFinish = values.length;

        step(20); // more frames after finish
        // No new calls after the tween completes
        expect(values.length).toBe(countAtFinish);
        expect(values[values.length - 1]).toBe(10);
    });

    test('rate mode: callback is invoked each frame', () => {
        const { handle, step } = setup({ rate: 2 });

        const values: number[] = [];
        handle.play((v) => values.push(v));

        step(100); // 1s
        expect(values.length).toBe(100);
        expect(values[values.length - 1]).toBeCloseTo(2.0, 1);
    });

    test('rate mode: play() without callback still works', () => {
        const { handle, step } = setup({ rate: 2 });

        handle.play();
        step(100);
        expect(handle.value).toBeCloseTo(2.0, 1);
    });

    test('oscillation amplitude mode: callback is invoked each frame', () => {
        const { handle, step } = setup({
            wave: 'sine',
            amplitude: 0.5,
            frequency: 2,
        });

        const values: number[] = [];
        handle.play((v) => values.push(v));

        step(50);
        expect(values.length).toBe(50);
        // Values should match handle.value pattern
        expect(values.every((v) => Math.abs(v) <= 0.5 + 0.001)).toBe(true);
    });

    test('oscillation range mode: callback is invoked each frame', () => {
        const { handle, step } = setup({
            wave: 'sine',
            min: 0.3,
            max: 0.9,
            frequency: 3,
        });

        const values: number[] = [];
        handle.play((v) => values.push(v));

        step(50);
        expect(values.length).toBe(50);
        expect(values.every((v) => v >= 0.3 - 0.001 && v <= 0.9 + 0.001)).toBe(
            true,
        );
    });

    test('oscillation mode: play() without callback still works', () => {
        const { handle, step } = setup({
            wave: 'sine',
            amplitude: 1,
            frequency: 2,
        });

        handle.play();
        step(50);
        expect(handle.value).not.toBe(0);
    });

    test('tween mode: replaying with a new callback replaces the old one', () => {
        const { handle, step } = setup({
            from: 0,
            to: 10,
            duration: 1,
        });

        const first: number[] = [];
        handle.play((v) => first.push(v));
        step(10);

        handle.reset();
        const second: number[] = [];
        handle.play((v) => second.push(v));
        step(10);

        // First callback should have stopped receiving values after reset+replay
        expect(first.length).toBe(10);
        expect(second.length).toBe(10);
    });

    test('callback receives the final value on the last frame of a tween', () => {
        const { handle, step } = setup({
            from: 0,
            to: 100,
            duration: 0.5,
        });

        const values: number[] = [];
        handle.play((v) => values.push(v));

        step(60); // 0.6s — well past 0.5s duration
        expect(values[values.length - 1]).toBe(100);
    });
});

// ---------------------------------------------------------------------------
// General
// ---------------------------------------------------------------------------

describe('useAnimate — general', () => {
    test('handle exposes expected interface', () => {
        const { handle } = setup({ rate: 1 });

        expect(typeof handle.value).toBe('number');
        expect(typeof handle.play).toBe('function');
        expect(typeof handle.reset).toBe('function');
        expect(typeof handle.finished).toBe('boolean');
    });
});
