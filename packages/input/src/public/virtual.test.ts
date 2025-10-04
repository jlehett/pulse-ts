import { InputService } from '../domain/services/Input';
import { VirtualInput } from './virtual';

describe('VirtualInput', () => {
    test('press/release inject digital and axis2D accumulates', () => {
        const svc = new InputService();
        const vi = new VirtualInput(svc);

        vi.press('jump');
        svc.commit();
        expect(svc.action('jump').pressed).toBe(true);

        vi.release('jump');
        svc.commit();
        expect(svc.action('jump').released).toBe(true);

        vi.axis2D('look', { x: 2, y: -1 });
        svc.commit();
        expect(svc.vec2('look')).toMatchObject({ x: 2, y: -1 });
    });

    test('axis1D inject sets numeric axis for one frame', () => {
        const svc = new InputService();
        const vi = new VirtualInput(svc);

        vi.axis1D('throttle', 0.7);
        svc.commit();
        expect(svc.axis('throttle')).toBe(0.7);
        // next frame clears injected value
        svc.commit();
        expect(svc.axis('throttle')).toBe(0);
    });

    test('digital press from multiple sources keeps action down until all released', () => {
        const svc = new InputService();
        const vi = new VirtualInput(svc);

        vi.press('jump', 'a');
        vi.press('jump', 'b');
        svc.commit();
        expect(svc.action('jump').down).toBe(true);

        vi.release('jump', 'a');
        svc.commit();
        expect(svc.action('jump').down).toBe(true);

        vi.release('jump', 'b');
        svc.commit();
        expect(svc.action('jump').down).toBe(false);
    });
});
