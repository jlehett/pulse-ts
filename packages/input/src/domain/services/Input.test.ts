import { InputService } from './Input';
import {
    Axis1D,
    Axis2D,
    Key,
    PointerMovement,
    PointerWheelScroll,
    PointerButton,
    Chord,
    Sequence,
} from '../../domain/bindings/expr';

function worldStub() {
    let frame = 0;
    return {
        getFrameId: () => frame,
        _inc: () => {
            frame++;
        },
    } as any;
}

describe('InputService', () => {
    test('digital key press/hold/release and events', () => {
        const svc = new InputService();
        const w = worldStub();
        svc.attach(w);
        svc.setBindings({ moveX: Axis1D({ pos: Key('D'), neg: Key('A') }) });

        const events: any[] = [];
        svc.actionEvent.on((e) => events.push(e));

        svc.handleKey('KeyD', true);
        svc.commit();
        w._inc();
        expect(svc.action('moveX')).toMatchObject({
            down: true,
            pressed: true,
            value: 1,
        });
        expect(events.pop()?.name).toBe('moveX');

        svc.commit();
        w._inc();
        expect(svc.action('moveX')).toMatchObject({
            down: true,
            pressed: false,
            value: 1,
        });

        svc.handleKey('KeyD', false);
        svc.commit();
        w._inc();
        expect(svc.action('moveX')).toMatchObject({
            down: false,
            released: true,
            value: 0,
        });
    });

    test('axis2d from key pairs', () => {
        const svc = new InputService();
        const w = worldStub();
        svc.attach(w);
        svc.setBindings({
            move: Axis2D({
                x: { pos: Key('D'), neg: Key('A') },
                y: { pos: Key('W'), neg: Key('S') },
            }),
        });
        svc.handleKey('KeyD', true);
        svc.handleKey('KeyW', true);
        svc.commit();
        w._inc();
        expect(svc.vec2('move')).toMatchObject({ x: 1, y: 1 });
    });

    test('pointer movement and wheel', () => {
        const svc = new InputService();
        const w = worldStub();
        svc.attach(w);
        svc.setBindings({
            look: PointerMovement({ scaleX: 2, invertY: true }),
            zoom: PointerWheelScroll({ scale: 0.5 }),
        });

        svc.handlePointerMove(0, 0, 1, 2, false, 0);
        svc.commit();
        w._inc();
        expect(svc.vec2('look')).toMatchObject({ x: 2, y: -2 });
        expect(svc.pointerState().deltaX).toBe(1);

        svc.handleWheel(0, 2, 0);
        svc.commit();
        w._inc();
        expect(svc.axis('zoom')).toBe(1);
        // next frame resets wheel value
        svc.commit();
        w._inc();
        expect(svc.axis('zoom')).toBe(0);
    });

    test('pointer vec2 resets to zero next frame', () => {
        const svc = new InputService();
        const w = worldStub();
        svc.attach(w);
        svc.setBindings({ look: PointerMovement({}) });
        svc.handlePointerMove(0, 0, 3, -2, false, 0);
        svc.commit();
        w._inc();
        expect(svc.vec2('look')).toMatchObject({ x: 3, y: -2 });
        // No movement next frame -> should reset to zero
        svc.commit();
        w._inc();
        expect(svc.vec2('look')).toMatchObject({ x: 0, y: 0 });
    });

    test('wheel emits pressed/released events across frames', () => {
        const svc = new InputService();
        const w = worldStub();
        svc.attach(w);
        svc.setBindings({ zoom: PointerWheelScroll({ scale: 1 }) });

        const events: any[] = [];
        svc.actionEvent.on((e) => events.push(e));

        svc.handleWheel(0, 2, 0);
        svc.commit();
        w._inc();
        expect(events.pop()?.state.pressed).toBe(true);
        svc.commit();
        w._inc();
        expect(events.pop()?.state.released).toBe(true);
    });

    test('multi-key chord requires simultaneous hold', () => {
        const svc = new InputService();
        const w = worldStub();
        svc.attach(w);
        svc.setBindings({ combo: Chord([Key('ControlLeft'), Key('KeyC')]) });

        // Only Control down -> not active
        svc.handleKey('ControlLeft', true);
        svc.commit();
        w._inc();
        expect(svc.action('combo').down).toBe(false);

        // Now press C as well -> active
        svc.handleKey('KeyC', true);
        svc.commit();
        w._inc();
        expect(svc.action('combo').down).toBe(true);

        // Release one -> inactive
        svc.handleKey('KeyC', false);
        svc.commit();
        w._inc();
        expect(svc.action('combo').down).toBe(false);
    });

    test('sequence boundaries and resetOnWrong=false', () => {
        const svc = new InputService();
        const w = worldStub();
        svc.attach(w);
        svc.setBindings({
            seq: Sequence([Key('KeyA'), Key('KeyB')], { maxGapFrames: 2 }),
            seq2: Sequence([Key('KeyX'), Key('KeyY')], {
                maxGapFrames: 2,
                resetOnWrong: false,
            }),
        });

        // Within boundary (press B within 2 frames of A)
        svc.handleKey('KeyA', true);
        svc.commit();
        w._inc();
        svc.handleKey('KeyA', false);
        // Do not advance extra frames beyond the two commits above
        // Press B now while within the maxGapFrames boundary
        svc.handleKey('KeyB', true);
        svc.commit();
        w._inc();
        expect(svc.action('seq').pressed).toBe(true);

        // Beyond boundary resets
        svc.commit();
        w._inc();
        svc.handleKey('KeyA', true);
        svc.commit();
        w._inc();
        svc.handleKey('KeyA', false);
        svc.commit();
        w._inc();
        // Wait 3 frames -> exceeds maxGapFrames
        svc.commit();
        w._inc();
        svc.commit();
        w._inc();
        svc.commit();
        w._inc();
        svc.handleKey('KeyB', true);
        svc.commit();
        w._inc();
        expect(svc.action('seq').pressed).toBe(false);

        // resetOnWrong=false should not reset on wrong key; sequence continues only on correct steps
        svc.handleKey('KeyX', true);
        svc.commit();
        w._inc();
        svc.handleKey('KeyZ', true); // wrong
        svc.commit();
        w._inc();
        // Now press Y; since resetOnWrong=false, sequence should still expect Y as second step without reset
        svc.handleKey('KeyY', true);
        svc.commit();
        w._inc();
        expect(svc.action('seq2').pressed).toBe(true);
    });

    test('default getters return zeroed states for unknown actions', () => {
        const svc = new InputService();
        const w = worldStub();
        svc.attach(w);
        expect(svc.action('unknown')).toMatchObject({
            down: false,
            pressed: false,
            released: false,
            value: 0,
        });
        expect(svc.vec2('unknown')).toMatchObject({ x: 0, y: 0 });
    });

    test('multiple pointer movement actions accumulate separately', () => {
        const svc = new InputService();
        const w = worldStub();
        svc.attach(w);
        svc.setBindings({
            look: PointerMovement({ scaleX: 2, invertY: true }),
            aim: PointerMovement({ scaleX: 0.5, scaleY: 0.5 }),
        });

        svc.handlePointerMove(0, 0, 1, 2, false, 0);
        svc.commit();
        w._inc();
        expect(svc.vec2('look')).toMatchObject({ x: 2, y: -2 });
        expect(svc.vec2('aim')).toMatchObject({ x: 0.5, y: 1 });
    });

    test('pointer locked flag reflects input and buttons bitmask is stored', () => {
        const svc = new InputService();
        const w = worldStub();
        svc.attach(w);
        svc.handlePointerMove(0, 0, 0, 0, true, 5);
        svc.commit();
        w._inc();
        expect(svc.pointerState().locked).toBe(true);
        expect(svc.pointerState().buttons).toBe(5 >>> 0);
        svc.handlePointerMove(0, 0, 0, 0, false, 0);
        svc.commit();
        w._inc();
        expect(svc.pointerState().locked).toBe(false);
    });

    test('key bound to multiple actions updates both', () => {
        const svc = new InputService();
        const w = worldStub();
        svc.attach(w);
        svc.setBindings({ a1: Key('Space'), a2: Key('Space') });
        svc.handleKey('Space', true);
        svc.commit();
        w._inc();
        expect(svc.action('a1').pressed).toBe(true);
        expect(svc.action('a2').pressed).toBe(true);
        svc.handleKey('Space', false);
        svc.commit();
        w._inc();
        expect(svc.action('a1').released).toBe(true);
        expect(svc.action('a2').released).toBe(true);
    });

    test('Axis1D scale applied to value', () => {
        const svc = new InputService();
        const w = worldStub();
        svc.attach(w);
        svc.setBindings({ thrust: Axis1D({ pos: Key('KeyD'), scale: 2 }) });
        svc.handleKey('KeyD', true);
        svc.commit();
        w._inc();
        expect(svc.axis('thrust')).toBe(2);
        svc.handleKey('KeyD', false);
        svc.commit();
        w._inc();
        expect(svc.axis('thrust')).toBe(0);
    });

    test('pointer button maps to digital action', () => {
        const svc = new InputService();
        const w = worldStub();
        svc.attach(w);
        svc.setBindings({ fire: PointerButton(0) });

        svc.handlePointerButton(0, true);
        svc.commit();
        w._inc();
        expect(svc.action('fire')).toMatchObject({
            down: true,
            pressed: true,
            value: 1,
        });

        svc.handlePointerButton(0, false);
        svc.commit();
        w._inc();
        expect(svc.action('fire')).toMatchObject({
            down: false,
            released: true,
            value: 0,
        });
    });

    test('chord and sequence pulses', () => {
        const svc = new InputService();
        const w = worldStub();
        svc.attach(w);
        svc.setBindings({
            jump: Chord([Key('Space')]),
            combo: Sequence([Key('KeyA'), Key('KeyB')], { maxGapFrames: 5 }),
        });

        // chord
        svc.handleKey('Space', true);
        svc.commit();
        w._inc();
        expect(svc.action('jump').down).toBe(true);
        svc.handleKey('Space', false);
        svc.commit();
        w._inc();
        expect(svc.action('jump').down).toBe(false);

        // sequence
        svc.handleKey('KeyA', true);
        svc.commit();
        w._inc();
        svc.handleKey('KeyA', false);
        svc.commit();
        w._inc();
        svc.handleKey('KeyB', true);
        svc.commit();
        w._inc();
        expect(svc.action('combo').pressed).toBe(true);
        svc.commit();
        w._inc();
        expect(svc.action('combo').pressed).toBe(false);
    });
});
