/**
 * Auto-reload scheduling for version updates.
 *
 * Manages a deferred page reload that can be cancelled if the user starts
 * a new match before the reload fires.
 *
 * @example
 * ```ts
 * import { createAutoReloader } from './updateAutoReload';
 *
 * const reloader = createAutoReloader();
 * reloader.schedule();  // reload in ~2s
 * reloader.cancel();    // changed mind — cancel
 * reloader.dispose();   // cleanup
 * ```
 */

/** Delay before the page reload fires (ms). */
export const RELOAD_DELAY = 2000;

export interface AutoReloader {
    /** Schedule a page reload after {@link RELOAD_DELAY} ms. No-op if already scheduled. */
    schedule(): void;
    /** Cancel a pending reload. Safe to call when nothing is scheduled. */
    cancel(): void;
    /** Cancel any pending reload and prevent future scheduling. */
    dispose(): void;
}

/**
 * Create an auto-reloader that calls `location.reload()` after a short delay.
 *
 * @param reloadFn - Override for the reload action (useful for testing).
 * @returns An {@link AutoReloader} handle.
 *
 * @example
 * ```ts
 * const reloader = createAutoReloader();
 * reloader.schedule();
 * ```
 */
export function createAutoReloader(
    reloadFn: () => void = () => location.reload(),
): AutoReloader {
    let handle: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    return {
        schedule() {
            if (disposed || handle !== null) return;
            handle = setTimeout(() => {
                handle = null;
                reloadFn();
            }, RELOAD_DELAY);
        },
        cancel() {
            if (handle !== null) {
                clearTimeout(handle);
                handle = null;
            }
        },
        dispose() {
            this.cancel();
            disposed = true;
        },
    };
}
