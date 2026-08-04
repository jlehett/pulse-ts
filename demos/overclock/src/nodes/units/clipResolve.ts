import type { ClipSlot } from '../../config/models';

/** Name synonyms per animation slot (see {@link resolveClipNames}). */
const CLIP_PATTERNS: Record<ClipSlot, RegExp> = {
    idle: /idle|breath|stand/i,
    move: /walk|run|move|locomot|hover/i,
    attack: /attack|punch|slash|shoot|swing|fire|hit|melee/i,
    cast: /cast|spell|skill|abilit|special/i,
    death: /death|die|dead|defeat/i,
};

const SLOTS: ClipSlot[] = ['idle', 'move', 'attack', 'cast', 'death'];

/**
 * Maps a model's animation clip names onto the game's animation slots.
 * Explicit overrides win; otherwise the first clip whose name matches the
 * slot's synonyms is used. A model with clips but no matches uses its
 * first clip as the idle so single-animation models still animate.
 *
 * @param names - Clip names present in the model file.
 * @param overrides - Explicit slot → clip-name mapping from the registry.
 * @returns Slot → clip-name for every slot that could be resolved.
 *
 * @example
 * resolveClipNames(['Idle', 'Run', 'Punch'], {});
 * // { idle: 'Idle', move: 'Run', attack: 'Punch' }
 */
export function resolveClipNames(
    names: readonly string[],
    overrides: Partial<Record<ClipSlot, string>> = {},
): Partial<Record<ClipSlot, string>> {
    const out: Partial<Record<ClipSlot, string>> = {};
    for (const slot of SLOTS) {
        const override = overrides[slot];
        if (override && names.includes(override)) {
            out[slot] = override;
            continue;
        }
        const match = names.find((n) => CLIP_PATTERNS[slot].test(n));
        if (match) out[slot] = match;
    }
    if (Object.keys(out).length === 0 && names.length > 0) {
        out.idle = names[0];
    }
    return out;
}
