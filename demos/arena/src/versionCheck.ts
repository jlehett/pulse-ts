/**
 * Client version checking module.
 *
 * Polls a `version.json` manifest on the server and compares against the
 * build-time `__APP_VERSION__` constant injected by Vite. When a mismatch
 * is detected, subscribers are notified so the UI can prompt a reload.
 *
 * @example
 * ```ts
 * import { startVersionPolling, onUpdateAvailable, getAppVersion } from './versionCheck';
 *
 * startVersionPolling();
 * onUpdateAvailable(() => {
 *     console.log('New version deployed — reload when ready');
 * });
 * console.log('Running version:', getAppVersion());
 * ```
 */

import { getBaseUrl } from './baseUrl';

declare const __APP_VERSION__: string;

/** The version baked into this build. `'dev'` during local development. */
const currentVersion: string = __APP_VERSION__;

/** Whether a newer version has been detected on the server. */
let updateAvailable = false;

/** Subscribers notified when an update is first detected. */
const listeners: Array<() => void> = [];

/** Active polling interval handle, if any. */
let pollHandle: ReturnType<typeof setInterval> | null = null;

/**
 * Returns the version string baked into this build.
 *
 * @returns The build-time version (short git SHA in production, `'dev'` locally).
 *
 * @example
 * ```ts
 * console.log(getAppVersion()); // e.g. 'a1b2c3d'
 * ```
 */
export function getAppVersion(): string {
    return currentVersion;
}

/**
 * Returns whether a newer server version has been detected.
 *
 * @returns `true` if the server's `version.json` reports a different version.
 *
 * @example
 * ```ts
 * if (isUpdateAvailable()) {
 *     location.reload();
 * }
 * ```
 */
export function isUpdateAvailable(): boolean {
    return updateAvailable;
}

/**
 * Register a callback that fires once when a version mismatch is first detected.
 * If an update is already available at the time of registration, the callback
 * fires immediately (asynchronously).
 *
 * @param fn - Callback invoked when an update becomes available.
 * @returns An unsubscribe function.
 *
 * @example
 * ```ts
 * const off = onUpdateAvailable(() => console.log('Update ready'));
 * off(); // unsubscribe
 * ```
 */
export function onUpdateAvailable(fn: () => void): () => void {
    listeners.push(fn);
    if (updateAvailable) {
        Promise.resolve().then(fn);
    }
    return () => {
        const idx = listeners.indexOf(fn);
        if (idx >= 0) listeners.splice(idx, 1);
    };
}

/**
 * Fetches `version.json` from the server and compares with the current build.
 * On mismatch, sets {@link updateAvailable} and notifies listeners.
 *
 * @returns The server version string, or `null` on fetch failure.
 */
export async function checkVersion(): Promise<string | null> {
    try {
        const resp = await fetch(
            `${getBaseUrl()}version.json?_=${Date.now()}`,
            { cache: 'no-store' },
        );
        if (!resp.ok) return null;
        const data = (await resp.json()) as { version?: string };
        const serverVersion = data.version ?? null;
        if (
            serverVersion &&
            currentVersion !== 'dev' &&
            serverVersion !== currentVersion &&
            !updateAvailable
        ) {
            updateAvailable = true;
            for (const fn of listeners) {
                try {
                    fn();
                } catch {
                    /* listener errors are non-fatal */
                }
            }
        }
        return serverVersion;
    } catch {
        return null;
    }
}

/**
 * Starts periodic polling for version updates.
 *
 * @param intervalMs - Polling interval in milliseconds. Defaults to 60000 (60s).
 *
 * @example
 * ```ts
 * startVersionPolling();        // every 60s
 * startVersionPolling(30_000);  // every 30s
 * ```
 */
export function startVersionPolling(intervalMs = 60_000): void {
    if (pollHandle !== null) return; // already polling
    // Check immediately on start, then periodically
    checkVersion();
    pollHandle = setInterval(checkVersion, intervalMs);
}

/**
 * Stops version polling if active.
 *
 * @example
 * ```ts
 * stopVersionPolling();
 * ```
 */
export function stopVersionPolling(): void {
    if (pollHandle !== null) {
        clearInterval(pollHandle);
        pollHandle = null;
    }
}

/**
 * Resets all version check state. Used for testing.
 */
export function resetVersionCheck(): void {
    stopVersionPolling();
    updateAvailable = false;
    listeners.length = 0;
}
