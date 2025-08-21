export type { Scheduler } from './scheduler';
export { nowMilliseconds } from './scheduler';
export { RAFScheduler } from './raf_scheduler';
export { TimeoutScheduler } from './timeout_scheduler';

/** Choose the default scheduler for the current environment. */
export function defaultScheduler() {
    const hasRAF =
        typeof requestAnimationFrame !== 'undefined' &&
        typeof cancelAnimationFrame !== 'undefined';
    return hasRAF ? new (requireLike('raf'))() : new (requireLike('timeout'))();
}

/**
 * Tiny indirection to avoid bundlers trying to statically analyze env at build time.
 * We only need this to construct the right class without importing both at runtime.
 */
function requireLike(kind: 'raf' | 'timeout') {
    if (kind === 'raf') {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { RAFScheduler } = require('./raf_scheduler');
        return RAFScheduler;
    } else {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { TimeoutScheduler } = require('./timeout_scheduler');
        return TimeoutScheduler;
    }
}
