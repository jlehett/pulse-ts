import { Axis1D, Axis2D, Key } from '@pulse-ts/input';

/** Player 1 input bindings — WASD movement, Space to dash. */
export const p1Bindings = {
    move: Axis2D({
        x: Axis1D({ pos: Key('KeyD'), neg: Key('KeyA') }),
        y: Axis1D({ pos: Key('KeyW'), neg: Key('KeyS') }),
    }),
    dash: Key('Space'),
    action: Key('ShiftLeft'),
};

/** Player 2 input bindings — Arrow keys movement, Enter to dash. */
export const p2Bindings = {
    move: Axis2D({
        x: Axis1D({ pos: Key('ArrowRight'), neg: Key('ArrowLeft') }),
        y: Axis1D({ pos: Key('ArrowUp'), neg: Key('ArrowDown') }),
    }),
    dash: Key('Enter'),
    action: Key('ShiftRight'),
};
