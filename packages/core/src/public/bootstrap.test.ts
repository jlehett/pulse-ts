import { World } from '../domain/world/world';
import { installDefaults } from './bootstrap';
import { StatsService } from '../domain/services/Stats';
import { CullingSystem } from '../domain/systems/Culling';

describe('public bootstrap', () => {
    test('installDefaults installs StatsService and CullingSystem', () => {
        const w = new World();
        expect(w.getService(StatsService)).toBeUndefined();
        expect(w.getSystem(CullingSystem)).toBeUndefined();

        installDefaults(w);

        expect(w.getService(StatsService)).toBeTruthy();
        expect(w.getSystem(CullingSystem)).toBeTruthy();
    });
});
