import { PointerButton } from '@pulse-ts/input';

/**
 * Input bindings for the battle scene. Overclock is mouse-driven: left
 * click selects/drags, right click sells/cancels.
 */
export const BINDINGS = {
    select: PointerButton(0),
    cancel: PointerButton(2),
};
