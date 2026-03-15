import { describe, it, expect, vi } from 'vitest';
import { createTrailEmitter } from './trailEmitter';

describe('createTrailEmitter', () => {
    it('emits when velocity exceeds threshold and interval elapses', () => {
        const emitter = createTrailEmitter();
        const emit = vi.fn();

        // vmag = 3 (matches TRAIL_VELOCITY_REFERENCE), interval = 0.015
        emitter.update(0.02, 3, true, emit);
        expect(emit).toHaveBeenCalledTimes(1);
    });

    it('does not emit when velocity is below threshold', () => {
        const emitter = createTrailEmitter();
        const emit = vi.fn();

        emitter.update(0.1, 0.05, true, emit);
        expect(emit).not.toHaveBeenCalled();
    });

    it('does not emit when inactive', () => {
        const emitter = createTrailEmitter();
        const emit = vi.fn();

        emitter.update(0.1, 10, false, emit);
        expect(emit).not.toHaveBeenCalled();
    });

    it('resets accumulator when velocity drops below threshold', () => {
        const emitter = createTrailEmitter();
        const emit = vi.fn();

        // Accumulate some time at high speed but not enough to emit
        emitter.update(0.005, 3, true, emit);
        expect(emit).not.toHaveBeenCalled();

        // Drop below threshold — accumulator should reset
        emitter.update(0.001, 0.01, true, emit);

        // Now high speed again — should need full interval to emit
        emitter.update(0.005, 3, true, emit);
        expect(emit).not.toHaveBeenCalled();
    });

    it('resets accumulator when going inactive', () => {
        const emitter = createTrailEmitter();
        const emit = vi.fn();

        // Accumulate some time
        emitter.update(0.005, 3, true, emit);

        // Go inactive — accumulator resets
        emitter.update(0.001, 3, false, emit);

        // Back to active — needs full interval again
        emitter.update(0.005, 3, true, emit);
        expect(emit).not.toHaveBeenCalled();
    });

    it('emits faster at higher velocities', () => {
        const slowEmitter = createTrailEmitter();
        const fastEmitter = createTrailEmitter();
        const slowEmit = vi.fn();
        const fastEmit = vi.fn();

        // At vmag=1 (below reference), interval = 0.015 / (1/3) = 0.045
        // At vmag=9 (3x reference), interval = 0.015 / (9/3) = 0.005
        const dt = 0.01;
        slowEmitter.update(dt, 1, true, slowEmit);
        fastEmitter.update(dt, 9, true, fastEmit);

        // Fast should emit (0.01 >= 0.005), slow should not (0.01 < 0.045)
        expect(fastEmit).toHaveBeenCalledTimes(1);
        expect(slowEmit).not.toHaveBeenCalled();
    });

    it('reset() clears the accumulator', () => {
        const emitter = createTrailEmitter();
        const emit = vi.fn();

        // Accumulate some time
        emitter.update(0.01, 3, true, emit);
        emit.mockClear();

        // Reset
        emitter.reset();

        // Should need a full interval again
        emitter.update(0.005, 3, true, emit);
        expect(emit).not.toHaveBeenCalled();
    });

    it('accumulates across multiple updates before emitting', () => {
        const emitter = createTrailEmitter();
        const emit = vi.fn();

        // vmag=3, interval=0.015. Three small ticks.
        emitter.update(0.004, 3, true, emit);
        expect(emit).not.toHaveBeenCalled();

        emitter.update(0.004, 3, true, emit);
        expect(emit).not.toHaveBeenCalled();

        emitter.update(0.004, 3, true, emit);
        expect(emit).not.toHaveBeenCalled();

        emitter.update(0.004, 3, true, emit);
        expect(emit).toHaveBeenCalledTimes(1);
    });
});
