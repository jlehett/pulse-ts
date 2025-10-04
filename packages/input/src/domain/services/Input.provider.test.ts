import type { InputProvider } from '../bindings/types';
import { InputService } from './Input';

function worldStub() {
    let frame = 0;
    return {
        getFrameId: () => frame,
        _inc: () => {
            frame++;
        },
    } as any;
}

class FakeProvider implements InputProvider {
    started = false;
    stopped = false;
    updates = 0;
    start(_target: EventTarget): void {
        this.started = true;
    }
    stop(): void {
        this.stopped = true;
    }
    update(): void {
        this.updates++;
    }
}

describe('InputService provider lifecycle', () => {
    test('registerProvider starts if already attached and calls update during commit', () => {
        const svc = new InputService();
        const w = worldStub();
        svc.attach(w);
        const p = new FakeProvider();
        svc.registerProvider(p);
        expect(p.started).toBe(true);
        svc.commit();
        expect(p.updates).toBe(1);
        svc.detach();
        expect(p.stopped).toBe(true);
    });

    test('registerProvider defers start until attach', () => {
        const svc = new InputService();
        const p = new FakeProvider();
        svc.registerProvider(p);
        expect(p.started).toBe(false);
        const w = worldStub();
        svc.attach(w);
        expect(p.started).toBe(true);
    });
});

