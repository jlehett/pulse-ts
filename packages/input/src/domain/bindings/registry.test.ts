import { BindingRegistry } from './registry';
import {
    Key,
    Axis1D,
    Axis2D,
    PointerMovement,
    PointerWheelScroll,
    PointerButton,
    Chord,
    Sequence,
} from './expr';

describe('BindingRegistry', () => {
    test('compiles key, axes, pointer, wheel, button, chord, sequence', () => {
        const reg = new BindingRegistry();
        reg.setBindings({
            jump: Key('Space'),
            moveX: Axis1D({ pos: Key('D'), neg: Key('A') }),
            move: Axis2D({
                x: { pos: Key('D'), neg: Key('A') },
                y: { pos: Key('W'), neg: Key('S') },
            }),
            look: PointerMovement({ scaleX: 0.5, invertY: true }),
            aim: PointerMovement({ scaleX: 0.25, scaleY: 0.25 }),
            zoom: PointerWheelScroll({ scale: 2 }),
            fire: PointerButton(0),
            combo: Chord([Key('ControlLeft'), Key('KeyC')]),
            konami: Sequence(
                [
                    Key('ArrowUp'),
                    Key('ArrowUp'),
                    Key('ArrowDown'),
                    Key('ArrowDown'),
                    Key('ArrowLeft'),
                    Key('ArrowRight'),
                    Key('ArrowLeft'),
                    Key('ArrowRight'),
                    Key('KeyB'),
                    Key('KeyA'),
                ],
                { maxGapFrames: 20 },
            ),
        });

        expect(reg.getActionsForKey('Space')).toContain('jump');
        const pActs = reg.getPointerMoveActions();
        expect(pActs).toEqual(expect.arrayContaining(['look', 'aim']));
        const mod = reg.getPointerVec2Modifiers('look')!;
        expect(mod.scaleX).toBe(0.5);
        expect(mod.invertY).toBe(true);
        const modAim = reg.getPointerVec2Modifiers('aim')!;
        expect(modAim.scaleX).toBe(0.25);

        // axis2d derived axes exist
        const vecDefs = Array.from(reg.getVec2Defs());
        const moveDef = vecDefs.find(([name]) => name === 'move')![1];
        expect(moveDef.key1).toBeDefined();
        expect(moveDef.axis1).toContain('__axis:move:');

        // wheel
        const wheel = Array.from(reg.getWheelBindings());
        expect(wheel.find(([name]) => name === 'zoom')![1].scale).toBe(2);

        // button
        expect(reg.getActionsForButton(0)).toContain('fire');

        // chord
        const chords = Array.from(reg.getChords());
        const combo = chords.find(([name]) => name === 'combo')![1];
        expect(combo.codes).toEqual(
            expect.arrayContaining(['ControlLeft', 'KeyC']),
        );

        // sequence
        const seqs = Array.from(reg.getSequences());
        const konami = seqs.find(([name]) => name === 'konami')![1];
        expect(konami.maxGapFrames).toBe(20);
        expect(konami.steps[0]).toBe('ArrowUp');
    });

    test('Axis2D non-standard keys (x & z) map correctly', () => {
        const reg = new BindingRegistry();
        reg.setBindings({
            moveXZ: Axis2D({
                x: { pos: Key('KeyD'), neg: Key('KeyA') },
                z: { pos: Key('KeyW'), neg: Key('KeyS') },
            }),
        });
        const defs = Array.from(reg.getVec2Defs());
        const def = defs.find(([k]) => k === 'moveXZ')![1];
        expect(def.key1).toBe('x');
        expect(def.key2).toBe('z');
        expect(def.axis1).toContain('__axis:moveXZ:x');
        expect(def.axis2).toContain('__axis:moveXZ:z');
    });

    test('mergeBindings overrides Axis1D by name and appends new actions', () => {
        const reg = new BindingRegistry();
        reg.setBindings({
            throttle: Axis1D({ pos: Key('KeyW'), scale: 1 }),
        });
        // Merge should override throttle scale and add a new key action
        reg.mergeBindings({
            throttle: Axis1D({ pos: Key('KeyW'), scale: 3 }),
            jump: Key('Space'),
        });
        const axes = Array.from(reg.getAxes1DKeys());
        const thr = axes.find(([name]) => name === 'throttle')![1];
        expect(thr.scale).toBe(3);
        expect(reg.getActionsForKey('Space')).toContain('jump');
    });
});
