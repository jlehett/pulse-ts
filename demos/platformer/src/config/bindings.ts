import { Axis1D, Axis2D, Key } from '@pulse-ts/input';

export const bindings = {
    move: Axis2D({
        x: Axis1D({ pos: Key('KeyD'), neg: Key('KeyA') }),
        y: Axis1D({ pos: Key('KeyW'), neg: Key('KeyS') }),
    }),
    jump: Key('Space'),
    dash: Key('ShiftLeft'),
};
