import { PARTICLE_COUNT, BURST_LIFETIME } from './ParticleBurstNode';

describe('ParticleBurstNode', () => {
    it('exports expected particle count', () => {
        expect(PARTICLE_COUNT).toBe(24);
    });

    it('exports expected burst lifetime', () => {
        expect(BURST_LIFETIME).toBe(0.5);
    });

    it('particle count is a positive integer', () => {
        expect(Number.isInteger(PARTICLE_COUNT)).toBe(true);
        expect(PARTICLE_COUNT).toBeGreaterThan(0);
    });

    it('burst lifetime is a positive number', () => {
        expect(BURST_LIFETIME).toBeGreaterThan(0);
    });
});
