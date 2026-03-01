import { Axis1D, Axis2D, Key } from '@pulse-ts/input';

/**
 * Merged input bindings for both players in a single world.
 * Action names are namespaced per player (p1Move, p2Move, etc.)
 * so both players can be handled by a single `installInput` call.
 */
export const allBindings = {
    /** Player 1 movement — WASD. */
    p1Move: Axis2D({
        x: Axis1D({ pos: Key('KeyD'), neg: Key('KeyA') }),
        y: Axis1D({ pos: Key('KeyW'), neg: Key('KeyS') }),
    }),
    /** Player 1 dash — Space. */
    p1Dash: Key('Space'),

    /** Player 2 movement — Arrow keys. */
    p2Move: Axis2D({
        x: Axis1D({ pos: Key('ArrowRight'), neg: Key('ArrowLeft') }),
        y: Axis1D({ pos: Key('ArrowUp'), neg: Key('ArrowDown') }),
    }),
    /** Player 2 dash — Enter. */
    p2Dash: Key('Enter'),
};
