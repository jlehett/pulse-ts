/**
 * Scheduler adapters for `WorldOptions.scheduler` injection.
 *
 * - `RafScheduler`: uses `requestAnimationFrame` for browser-based loops.
 * - `TimeoutScheduler`: uses `setTimeout` to approximate a fixed FPS.
 * - `ManualScheduler`: lets you call `tick()` yourself (tests/simulations).
 *
 * @example
 * ```ts
 * import { World } from '@pulse-ts/core';
 * import { TimeoutScheduler } from '@pulse-ts/core';
 * const world = new World({ scheduler: new TimeoutScheduler(30) });
 * world.start();
 * ```
 */
export type { Scheduler } from '../infra/scheduler';
export {
    RafScheduler,
    TimeoutScheduler,
    ManualScheduler,
} from '../infra/scheduler';
