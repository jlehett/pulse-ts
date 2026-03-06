/**
 * Version matching logic for online play.
 *
 * Compares peer versions exchanged during lobby signaling to prevent
 * mismatched clients from starting a match.
 *
 * @example
 * ```ts
 * import { versionsMatch } from './versionMatch';
 *
 * versionsMatch('a1b2c3d', 'a1b2c3d'); // true
 * versionsMatch('a1b2c3d', 'x9y8z7w'); // false
 * versionsMatch('dev', 'a1b2c3d');     // true (dev bypasses check)
 * versionsMatch('a1b2c3d', '');        // true (missing = old client)
 * ```
 */

/**
 * Check whether two peer versions are compatible for online play.
 *
 * Returns `true` (allow match) when:
 * - Versions are identical.
 * - Either version is `'dev'` (local development).
 * - Either version is empty/missing (pre-version-check client).
 *
 * @param localVersion - This client's build version.
 * @param peerVersion - The remote peer's build version.
 * @returns `true` if the versions are compatible.
 *
 * @example
 * ```ts
 * versionsMatch('abc123', 'abc123'); // true
 * versionsMatch('abc123', 'def456'); // false
 * versionsMatch('dev', 'abc123');    // true
 * ```
 */
export function versionsMatch(
    localVersion: string,
    peerVersion: string,
): boolean {
    if (!localVersion || !peerVersion) return true;
    if (localVersion === 'dev' || peerVersion === 'dev') return true;
    return localVersion === peerVersion;
}
