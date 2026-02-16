import { World } from '../world/world';
import { StatsService } from './Stats';

describe('StatsService', () => {
    test('returns snapshot from world', () => {
        const w = new World({ fixedStepMs: 10 });
        // StatsService is not auto-installed; provide explicitly for tests
        const stats = w.provideService(new StatsService());
        // run some time to sample fps/sps
        w.tick(50);
        const snap = stats!.get();
        expect(typeof snap.fps).toBe('number');
        expect(typeof snap.fixedSps).toBe('number');
        expect(snap.frameId).toBeGreaterThan(0);
    });

    test('detach on removeService prevents access', () => {
        const w = new World({ fixedStepMs: 10 });
        const svc = w.provideService(new StatsService());
        // It works while attached
        w.tick(10);
        expect(() => svc.get()).not.toThrow();
        // After removal, access throws
        w.removeService(StatsService);
        expect(() => svc.get()).toThrow();
    });
});
