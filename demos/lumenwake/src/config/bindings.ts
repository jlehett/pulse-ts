import { Axis2D, Key, PointerButton } from '@pulse-ts/input';

export const allBindings = {
    move: Axis2D.wasd(),
    ability1: Key('KeyQ'),
    ability2: Key('KeyE'),
    fire: PointerButton(0),
    pause: Key('Escape'),
};
