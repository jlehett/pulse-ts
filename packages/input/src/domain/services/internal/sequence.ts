export type SequenceDef = {
    steps: string[];
    maxGapFrames: number;
    resetOnWrong: boolean;
};

export type SequenceRuntime = Map<string, { index: number; lastFrame: number }>;

/**
 * Advance sequence runtime state on a key down event.
 * Returns a set of action names that should pulse this frame.
 */
export function advanceSequencesForKey(
    code: string,
    frameId: number,
    sequences: Iterable<readonly [string, SequenceDef]>,
    state: SequenceRuntime,
): Set<string> {
    const pulses = new Set<string>();
    for (const [action, def] of sequences) {
        let st = state.get(action);
        if (!st) {
            st = { index: 0, lastFrame: frameId };
            state.set(action, st);
        }
        // Timeout between steps
        if (st.index > 0 && frameId - st.lastFrame > def.maxGapFrames) {
            st.index = 0;
        }
        const expected = def.steps[st.index];
        if (code === expected) {
            st.index++;
            st.lastFrame = frameId;
            if (st.index >= def.steps.length) {
                pulses.add(action);
                st.index = 0;
            }
        } else if (def.resetOnWrong !== false) {
            // allow immediate restart if key matches first step
            st.index = code === def.steps[0] ? 1 : 0;
            st.lastFrame = frameId;
        }
    }
    return pulses;
}
