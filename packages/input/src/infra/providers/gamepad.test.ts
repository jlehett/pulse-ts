import { GamepadProvider } from './gamepad';
import { InputService } from '../../domain/services/Input';

describe('GamepadProvider (stub)', () => {
    test('update is a safe no-op without navigator', () => {
        const svc = new InputService();
        const gp = new GamepadProvider(svc);
        // Should not throw when start/stop/update are called with non-DOM targets
        gp.start({} as any);
        gp.update();
        gp.stop();
    });
});
