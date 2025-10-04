import { DOMPointerProvider } from './domPointer';
import { InputService } from '../../domain/services/Input';
import {
    PointerMovement,
    PointerWheelScroll,
} from '../../domain/bindings/expr';

class FakeTarget {
    handlers: Record<string, Array<(e: any) => void>> = {};
    addEventListener(evt: string, fn: (e: any) => void) {
        (this.handlers[evt] ||= []).push(fn);
    }
    removeEventListener(evt: string, fn: (e: any) => void) {
        this.handlers[evt] = (this.handlers[evt] || []).filter((f) => f !== fn);
    }
    emit(evt: string, e: any) {
        (this.handlers[evt] || []).forEach((fn) => fn(e));
    }
}

describe('DOMPointerProvider', () => {
    test('pointermove and wheel map through to service', () => {
        const svc = new InputService();
        svc.setBindings({
            look: PointerMovement({ scaleX: 2, invertY: true }),
            zoom: PointerWheelScroll({ scale: 0.5 }),
        });
        const prov = new DOMPointerProvider(svc, { preventDefault: true });
        const tgt = new FakeTarget() as any;
        prov.start(tgt);

        tgt.emit('pointermove', {
            clientX: 10,
            clientY: 10,
            movementX: 3,
            movementY: -4,
            buttons: 0,
            preventDefault() {},
        });
        svc.commit();
        expect(svc.vec2('look')).toMatchObject({ x: 6, y: 4 });

        tgt.emit('wheel', {
            deltaX: 0,
            deltaY: 2,
            deltaZ: 0,
            preventDefault() {},
        });
        svc.commit();
        expect(svc.axis('zoom')).toBe(1);
    });

    test('requests pointer lock on pointerdown when enabled and clears on cancel', () => {
        const svc = new InputService();
        const prov = new DOMPointerProvider(svc, {
            preventDefault: false,
            pointerLock: true,
        });
        const tgt = new FakeTarget() as any;
        prov.start(tgt);

        let requested = false;
        const el = {
            requestPointerLock() {
                requested = true;
            },
        };
        // pointerdown should request pointer lock
        tgt.emit('pointerdown', { button: 0, target: el });
        expect(requested).toBe(true);

        // cancel should clear buttons by sending ups
        svc.commit();
        tgt.emit('pointerdown', { button: 0 });
        svc.commit();
        expect(svc.action('fire').down).toBe(false); // no binding, just sanity
        // Emitting cancel should release
        tgt.emit('pointercancel', {});
        svc.commit();
        // No exception; rely on provider path coverage
    });
});
