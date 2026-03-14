import { Axis2D, Key } from '@pulse-ts/input';

/**
 * Merged input bindings for both players in a single world.
 * Action names are namespaced per player (p1Move, p2Move, etc.)
 * so both players can be handled by a single `installInput` call.
 */
export const allBindings = {
    /** Player 1 movement — WASD. */
    p1Move: Axis2D.wasd(),
    /** Player 1 dash — Space. */
    p1Dash: Key('Space'),

    /** Player 2 movement — Arrow keys. */
    p2Move: Axis2D.arrows(),
    /** Player 2 dash — Enter. */
    p2Dash: Key('Enter'),

    /** Pause toggle — Escape. */
    pause: Key('Escape'),
};
