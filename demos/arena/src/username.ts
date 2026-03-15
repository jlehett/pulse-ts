/** LocalStorage key for the persisted username. */
export const USERNAME_KEY = 'pulse-arena-username';

/** Maximum allowed username length. */
export const USERNAME_MAX_LENGTH = 24;

/**
 * Retrieve the saved username from localStorage.
 *
 * @returns The stored username, or an empty string if none is saved.
 *
 * @example
 * ```ts
 * const name = getUsername();
 * if (name) console.log(`Welcome back, ${name}`);
 * ```
 */
export function getUsername(): string {
    try {
        return localStorage.getItem(USERNAME_KEY) || '';
    } catch {
        return '';
    }
}

/**
 * Check whether a username has been saved.
 *
 * @returns `true` if a non-empty username exists in localStorage.
 *
 * @example
 * ```ts
 * if (!hasUsername()) showUsernamePrompt();
 * ```
 */
export function hasUsername(): boolean {
    return getUsername().length > 0;
}

/**
 * Persist a username to localStorage. The value is trimmed and
 * truncated to {@link USERNAME_MAX_LENGTH} characters.
 *
 * @param name - The raw username string to save.
 *
 * @example
 * ```ts
 * setUsername('  Alice  '); // saves 'Alice'
 * ```
 */
export function setUsername(name: string): void {
    const validated = name.trim().slice(0, USERNAME_MAX_LENGTH);
    try {
        localStorage.setItem(USERNAME_KEY, validated);
    } catch {
        /* localStorage unavailable */
    }
}
