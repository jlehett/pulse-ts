import { DashCooldownStore } from './dashCooldown';

describe('DashCooldownStore', () => {
    it('factory returns both players ready (progress = 1)', () => {
        const state = DashCooldownStore._factory();
        expect(state.progress[0]).toBe(1);
        expect(state.progress[1]).toBe(1);
    });

    it('factory returns a fresh object each call', () => {
        const a = DashCooldownStore._factory();
        const b = DashCooldownStore._factory();
        expect(a).not.toBe(b);
    });

    it('has the correct store name', () => {
        expect(DashCooldownStore._key.description).toBe('dashCooldown');
    });
});
