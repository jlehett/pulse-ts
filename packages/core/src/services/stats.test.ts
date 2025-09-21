import { World } from '../world';
import { StatsService } from './Stats';

describe('StatsService', () => {
    test('returns snapshot from world', () => {
        const w = new World({ fixedStepMs: 10 });
        const stats = w.getService(StatsService);
        expect(stats).toBeTruthy();
        // run some time to sample fps/sps
        w.tick(50);
        const snap = stats!.get();
        expect(typeof snap.fps).toBe('number');
        expect(typeof snap.fixedSps).toBe('number');
        expect(snap.frameId).toBeGreaterThan(0);
    });
});
