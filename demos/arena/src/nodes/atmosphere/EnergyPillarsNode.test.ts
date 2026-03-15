import {
    EnergyPillarsNode,
    PILLAR_COUNT,
    PILLAR_RADIUS,
    PILLAR_HEIGHT,
    PILLAR_ORBIT_RADIUS,
    PILLAR_COLOR,
    PILLAR_EMISSIVE_MIN,
    PILLAR_EMISSIVE_MAX,
    PILLAR_PULSE_FREQ,
} from './EnergyPillarsNode';
import { ARENA_RADIUS } from '../../config/arena';

describe('EnergyPillarsNode', () => {
    it('is a function', () => {
        expect(typeof EnergyPillarsNode).toBe('function');
    });
});

describe('EnergyPillarsNode constants', () => {
    it('PILLAR_ORBIT_RADIUS is greater than ARENA_RADIUS', () => {
        expect(PILLAR_ORBIT_RADIUS).toBeGreaterThan(ARENA_RADIUS);
    });

    it('PILLAR_COUNT is positive', () => {
        expect(PILLAR_COUNT).toBeGreaterThan(0);
    });

    it('PILLAR_RADIUS is positive', () => {
        expect(PILLAR_RADIUS).toBeGreaterThan(0);
    });

    it('PILLAR_HEIGHT is positive', () => {
        expect(PILLAR_HEIGHT).toBeGreaterThan(0);
    });

    it('PILLAR_COLOR is a valid hex color', () => {
        expect(PILLAR_COLOR).toBeGreaterThan(0);
        expect(PILLAR_COLOR).toBeLessThanOrEqual(0xffffff);
    });

    it('PILLAR_EMISSIVE range is valid', () => {
        expect(PILLAR_EMISSIVE_MIN).toBeGreaterThan(0);
        expect(PILLAR_EMISSIVE_MAX).toBeGreaterThan(PILLAR_EMISSIVE_MIN);
    });

    it('PILLAR_PULSE_FREQ is positive', () => {
        expect(PILLAR_PULSE_FREQ).toBeGreaterThan(0);
    });
});
