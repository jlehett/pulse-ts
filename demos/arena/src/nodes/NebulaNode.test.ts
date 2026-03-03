import {
    NebulaNode,
    NEBULA_RADIUS,
    NEBULA_SPEED,
    NEBULA_INTENSITY,
    NEBULA_COLOR_DEEP,
    NEBULA_COLOR_BRIGHT,
} from './NebulaNode';

describe('NebulaNode', () => {
    it('is a function', () => {
        expect(typeof NebulaNode).toBe('function');
    });
});

describe('NebulaNode constants', () => {
    it('NEBULA_RADIUS is positive and beyond the starfield', () => {
        expect(NEBULA_RADIUS).toBeGreaterThan(80);
    });

    it('NEBULA_SPEED is positive', () => {
        expect(NEBULA_SPEED).toBeGreaterThan(0);
    });

    it('NEBULA_INTENSITY is between 0 and 1', () => {
        expect(NEBULA_INTENSITY).toBeGreaterThan(0);
        expect(NEBULA_INTENSITY).toBeLessThanOrEqual(1);
    });

    it('NEBULA_COLOR_DEEP is a valid hex color', () => {
        expect(NEBULA_COLOR_DEEP).toBeGreaterThanOrEqual(0x000000);
        expect(NEBULA_COLOR_DEEP).toBeLessThanOrEqual(0xffffff);
    });

    it('NEBULA_COLOR_BRIGHT is a valid hex color', () => {
        expect(NEBULA_COLOR_BRIGHT).toBeGreaterThanOrEqual(0x000000);
        expect(NEBULA_COLOR_BRIGHT).toBeLessThanOrEqual(0xffffff);
    });
});
