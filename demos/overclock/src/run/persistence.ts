import type { RunState } from './runState';

const STORAGE_KEY = 'pulse-overclock-run';
const SAVE_VERSION = 1;

interface SaveEnvelope {
    version: number;
    run: RunState;
}

/**
 * Persists the run to localStorage so it can be continued later.
 * Failures (private browsing, quota) are swallowed — saving is best-effort.
 */
export function saveRun(run: RunState): void {
    try {
        const envelope: SaveEnvelope = { version: SAVE_VERSION, run };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
    } catch {
        // Best-effort only.
    }
}

/**
 * Loads a previously saved run, or null when none exists, the save is from
 * an incompatible version, or the run already ended.
 */
export function loadRun(): RunState | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const envelope = JSON.parse(raw) as SaveEnvelope;
        if (envelope.version !== SAVE_VERSION) return null;
        if (!envelope.run || envelope.run.status !== 'active') return null;
        return envelope.run;
    } catch {
        return null;
    }
}

/** Deletes the saved run (after victory/defeat/abandon). */
export function clearRun(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        // Best-effort only.
    }
}
