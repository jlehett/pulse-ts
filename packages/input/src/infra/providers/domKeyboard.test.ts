import { DOMKeyboardProvider } from './domKeyboard';
import { InputService } from '../../domain/services/Input';
import { Key } from '../../domain/bindings/expr';

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

describe('DOMKeyboardProvider', () => {
    test('translates DOM events to service key handling', () => {
        const svc = new InputService();
        svc.setBindings({ jump: Key('Space') });
        const prov = new DOMKeyboardProvider(svc, { preventDefault: true });
        const tgt = new FakeTarget() as any;
        prov.start(tgt);

        tgt.emit('keydown', { code: 'Space', preventDefault() {} });
        svc.commit();
        expect(svc.action('jump').pressed).toBe(true);

        tgt.emit('keyup', { code: 'Space', preventDefault() {} });
        svc.commit();
        expect(svc.action('jump').released).toBe(true);
    });

    test('ignores repeat keydown events for stability', () => {
        const svc = new InputService();
        svc.setBindings({ jump: Key('Space') });
        const prov = new DOMKeyboardProvider(svc, { preventDefault: false });
        const tgt = new FakeTarget() as any;
        prov.start(tgt);

        const events: any[] = [];
        svc.actionEvent.on((e) => events.push(e));

        tgt.emit('keydown', { code: 'Space', repeat: false });
        svc.commit();
        tgt.emit('keydown', { code: 'Space', repeat: true });
        svc.commit();
        expect(svc.action('jump').down).toBe(true);
        // Only one pressed event should have been emitted
        const pressedCount = events.filter((e) => e.state.pressed).length;
        expect(pressedCount).toBe(1);
    });
});
