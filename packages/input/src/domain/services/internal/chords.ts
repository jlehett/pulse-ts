/**
 * Compute which chord actions are currently held based on keysDown.
 */
export function computeChordDownActions(
    keysDown: Set<string>,
    chords: Iterable<readonly [string, { codes: string[] }]>,
): Set<string> {
    const result = new Set<string>();
    for (const [action, def] of chords) {
        const allDown = def.codes.every((c) => keysDown.has(c));
        if (allDown) result.add(action);
    }
    return result;
}
