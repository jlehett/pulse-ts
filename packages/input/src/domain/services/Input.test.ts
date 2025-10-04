import { InputService } from './Input';
import {
    Axis1D,
    Axis2D,
    Key,
    PointerMovement,
    PointerWheelScroll,
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
