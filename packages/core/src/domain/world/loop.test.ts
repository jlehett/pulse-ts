import { EngineLoop } from './loop';
import { ManualScheduler } from '../../infra/schedule';
import type { UpdateKind, UpdatePhase } from '../ecs/types';

function makeLoop(
    options?: Partial<{ fixed: number; maxSteps: number; maxFrameDt: number }>,
) {
    const scheduler = new ManualScheduler();
    const calls: Array<[UpdateKind, UpdatePhase, number]> = [];
    const loop = new EngineLoop(
        {
            scheduler,
            fixedStepMs: options?.fixed ?? 10,
            maxFixedStepsPerFrame: options?.maxSteps ?? 8,
            maxFrameDtMs: options?.maxFrameDt ?? 250,
        },
        {
            beforeFixedStep: () => void 0,
            runPhase: (k, p, dt) => calls.push([k, p, dt]),
        },
    );
    return { scheduler, loop, calls };
}

describe('EngineLoop', () => {
    test('fixed accumulation, ordering, and alpha', () => {
        const { loop, calls } = makeLoop({ fixed: 10 });
        // 25ms: expect 2 fixed steps and one frame pass
        loop.tick(25);
        // Fixed order per step: early, update, late; then frame early/update/late once
        const phases = calls.map((c) => `${c[0]}-${c[1]}`);
        expect(phases).toEqual([
            'fixed-early',
            'fixed-update',
            'fixed-late',
            'fixed-early',
            'fixed-update',
            'fixed-late',
            'frame-early',
            'frame-update',
            'frame-late',
        ]);
        // Remaining accumulator should be 5ms (for potential interpolation)
        expect(loop.getAccumulator()).toBeCloseTo(5);
    });

    test('timeScale affects dt and pause stops ticking', () => {
        const { loop, calls } = makeLoop({ fixed: 10 });
        loop.setTimeScale(0.5);
        loop.tick(20); // scaled to 10ms => exactly 1 fixed step
        const phases = calls.map((c) => `${c[0]}-${c[1]}`);
        expect(phases.slice(0, 3)).toEqual([
            'fixed-early',
            'fixed-update',
            'fixed-late',
        ]);
        // Pause: further ticks should not add phases
        const before = calls.length;
        loop.pause();
        loop.tick(100);
        expect(calls.length).toBe(before);
    });
});
