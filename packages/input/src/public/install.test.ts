import { World } from '@pulse-ts/core';
import { installInput, InputService, InputCommitSystem, Key } from '../index';

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

describe('installInput', () => {
    test('provides service, adds system, and wires providers', () => {
        const world = new World();
        const target = new FakeTarget() as any;
        const svc = installInput(world, {
            target,
            bindings: { jump: Key('Space') },
        });
        expect(world.getService(InputService)).toBe(svc);
        expect(world.getSystem(InputCommitSystem)).toBeTruthy();

        // simulate keypress through provider
        target.emit('keydown', { code: 'Space', preventDefault() {} });
        world.getSystem(InputCommitSystem)!.update();
        expect(svc.action('jump').pressed).toBe(true);
    });

    test('detach stops providers from handling further events', () => {
        const world = new World();
        const target = new FakeTarget() as any;
        const svc = installInput(world, {
            target,
            bindings: { jump: Key('Space') },
        });

        target.emit('keydown', { code: 'Space' });
        world.getSystem(InputCommitSystem)!.update();
        expect(svc.action('jump').pressed).toBe(true);

        // Detach and attempt another keydown — should not affect service
        svc.detach();
        target.emit('keydown', { code: 'Space' });
        world.getSystem(InputCommitSystem)!.update();
        // No new press; state remains from before detach (no repeat press)
        expect(svc.action('jump').pressed).toBe(false);
    });
});
