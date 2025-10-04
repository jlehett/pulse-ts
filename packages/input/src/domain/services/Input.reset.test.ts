import { InputService } from './Input';
import {
    Axis2D,
    Key,
    PointerMovement,
    PointerWheelScroll,
} from '../bindings/expr';

function worldStub() {
    let frame = 0;
    return {
        getFrameId: () => frame,
        _inc: () => {
            frame++;
        },
    } as any;
}

describe('InputService.reset()', () => {
    test('clears actions, axes, pointer, and injected state', () => {
        const svc = new InputService();
        const w = worldStub();
        svc.attach(w);
        svc.setBindings({
            move: Axis2D({
                x: { pos: Key('D'), neg: Key('A') },
                y: { pos: Key('W'), neg: Key('S') },
            }),
            look: PointerMovement({ scaleX: 2, invertY: true }),
            zoom: PointerWheelScroll({ scale: 0.5 }),
        });

        // Generate some state
        svc.handleKey('KeyD', true);
        svc.handlePointerMove(0, 0, 3, -4, true, 5);
        svc.handleWheel(0, 2, 0);
        svc.injectAxis1D('virt', 0.8);
        svc.commit();
        w._inc();

        expect(svc.action('move')).toBeDefined();
        expect(svc.vec2('look')).toMatchObject({ x: 6, y: 4 });
        expect(svc.axis('zoom')).toBe(1);
        expect(svc.pointerState().deltaX).toBe(3);
        expect(svc.axis('virt')).toBe(0.8);

        // Reset should clear all
        svc.reset();

        expect(svc.action('move')).toMatchObject({
            down: false,
            pressed: false,
            released: false,
            value: 0,
        });
        expect(svc.vec2('look')).toMatchObject({ x: 0, y: 0 });
        expect(svc.axis('zoom')).toBe(0);
        const p = svc.pointerState();
        expect(p.deltaX).toBe(0);
        expect(p.deltaY).toBe(0);
        expect(p.wheelY).toBe(0);
        expect(p.buttons >>> 0).toBe(0);
    });
});
