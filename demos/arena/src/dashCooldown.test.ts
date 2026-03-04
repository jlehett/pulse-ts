import {
    setDashCooldownProgress,
    getDashCooldownProgress,
    resetDashCooldownProgress,
} from './dashCooldown';

afterEach(() => {
    resetDashCooldownProgress();
});

describe('dashCooldown store', () => {
    it('starts with all players ready (progress = 1)', () => {
        expect(getDashCooldownProgress(0)).toBe(1);
        expect(getDashCooldownProgress(1)).toBe(1);
    });

    it('stores per-player progress independently', () => {
        setDashCooldownProgress(0, 0.3);
        setDashCooldownProgress(1, 0.7);
        expect(getDashCooldownProgress(0)).toBe(0.3);
        expect(getDashCooldownProgress(1)).toBe(0.7);
    });

    it('reset restores both to 1', () => {
        setDashCooldownProgress(0, 0);
        setDashCooldownProgress(1, 0.5);
        resetDashCooldownProgress();
        expect(getDashCooldownProgress(0)).toBe(1);
        expect(getDashCooldownProgress(1)).toBe(1);
    });
});
