import { clearRun, loadRun, saveRun } from './persistence';
import { createRun } from './runState';

describe('persistence', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('round-trips an active run', () => {
        const run = createRun('OVR-SAVED');
        run.gold = 33;
        saveRun(run);
        const loaded = loadRun();
        expect(loaded).toEqual(run);
    });

    it('returns null when nothing is saved', () => {
        expect(loadRun()).toBeNull();
    });

    it('drops finished runs', () => {
        const run = createRun('OVR-DONE');
        run.status = 'victory';
        saveRun(run);
        expect(loadRun()).toBeNull();
    });

    it('drops corrupt saves', () => {
        localStorage.setItem('pulse-overclock-run', '{not json');
        expect(loadRun()).toBeNull();
    });

    it('clearRun removes the save', () => {
        saveRun(createRun('OVR-GONE'));
        clearRun();
        expect(loadRun()).toBeNull();
    });
});
