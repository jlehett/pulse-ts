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
});
