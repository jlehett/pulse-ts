import type { ActionState } from '../../bindings/types';

/**
 * Compute the next ActionState from a previous state and a numeric value.
 * Down is interpreted as `value !== 0`.
 */
export function computeActionState(
    prev: ActionState | undefined,
    nextValue: number,
    frameId: number,
): ActionState {
    const wasDown = prev?.down ?? false;
    const down = nextValue !== 0;
    const pressed = down && !wasDown;
    const released = !down && wasDown;
    const since = pressed || released ? frameId : (prev?.since ?? frameId);
    return { down, pressed, released, value: nextValue, since };
}
