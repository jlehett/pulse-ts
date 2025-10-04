import { BindingRegistry } from './registry';
import {
    Key,
    Axis1D,
    Axis2D,
    PointerMovement,
    PointerWheelScroll,
    Chord,
    Sequence,
} from './expr';

describe('BindingRegistry', () => {
    test('compiles key, axes, pointer, wheel, chord, sequence', () => {
        const reg = new BindingRegistry();
        reg.setBindings({
            jump: Key('Space'),
            moveX: Axis1D({ pos: Key('D'), neg: Key('A') }),
            move: Axis2D({
                x: { pos: Key('D'), neg: Key('A') },
                y: { pos: Key('W'), neg: Key('S') },
            }),
            look: PointerMovement({ scaleX: 0.5, invertY: true }),
            zoom: PointerWheelScroll({ scale: 2 }),
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
        expect(reg.getPointerMoveAction()).toBe('look');
        const mod = reg.getPointerVec2Modifiers('look')!;
        expect(mod.scaleX).toBe(0.5);
        expect(mod.invertY).toBe(true);

        // axis2d derived axes exist
        const vecDefs = Array.from(reg.getVec2Defs());
        const moveDef = vecDefs.find(([name]) => name === 'move')![1];
        expect(moveDef.key1).toBeDefined();
        expect(moveDef.axis1).toContain('__axis:move:');

        // wheel
        const wheel = Array.from(reg.getWheelBindings());
        expect(wheel.find(([name]) => name === 'zoom')![1].scale).toBe(2);

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
});
