import {
    TouchControlsNode,
    computeJoystickDisplacement,
    applyDeadzone,
} from './TouchControlsNode';

describe('TouchControlsNode', () => {
    it('exports the node function', () => {
        expect(typeof TouchControlsNode).toBe('function');
    });
});

describe('computeJoystickDisplacement', () => {
    it('returns (0, 0) when touch is at center', () => {
        const { dx, dy } = computeJoystickDisplacement(100, 100, 100, 100, 60);
        expect(dx).toBeCloseTo(0, 5);
        expect(dy).toBeCloseTo(0, 5);
    });

    it('returns (1, 0) when touch is at right edge', () => {
        const { dx, dy } = computeJoystickDisplacement(160, 100, 100, 100, 60);
        expect(dx).toBeCloseTo(1, 5);
        expect(dy).toBeCloseTo(0, 5);
    });

    it('returns (-1, 0) when touch is at left edge', () => {
        const { dx, dy } = computeJoystickDisplacement(40, 100, 100, 100, 60);
        expect(dx).toBeCloseTo(-1, 5);
        expect(dy).toBeCloseTo(0, 5);
    });

    it('returns (0, 1) when touch is above center (Y inverted)', () => {
        const { dx, dy } = computeJoystickDisplacement(100, 40, 100, 100, 60);
        expect(dx).toBeCloseTo(0, 5);
        expect(dy).toBeCloseTo(1, 5);
    });

    it('returns (0, -1) when touch is below center (Y inverted)', () => {
        const { dx, dy } = computeJoystickDisplacement(100, 160, 100, 100, 60);
        expect(dx).toBeCloseTo(0, 5);
        expect(dy).toBeCloseTo(-1, 5);
    });

    it('clamps to unit circle when touch is beyond radius', () => {
        // Touch at (200, 100) — way beyond 60px radius from (100, 100)
        const { dx, dy } = computeJoystickDisplacement(200, 100, 100, 100, 60);
        const mag = Math.sqrt(dx * dx + dy * dy);
        expect(mag).toBeCloseTo(1, 5);
        expect(dx).toBeCloseTo(1, 5);
        expect(dy).toBeCloseTo(0, 5);
    });

    it('clamps diagonal touch beyond radius to unit circle', () => {
        // Diagonal: 100px on each axis from center, radius 60
        const { dx, dy } = computeJoystickDisplacement(200, 0, 100, 100, 60);
        const mag = Math.sqrt(dx * dx + dy * dy);
        expect(mag).toBeCloseTo(1, 5);
    });

    it('returns fractional values for partial displacement', () => {
        // Half the radius to the right
        const { dx, dy } = computeJoystickDisplacement(130, 100, 100, 100, 60);
        expect(dx).toBeCloseTo(0.5, 5);
        expect(dy).toBeCloseTo(0, 5);
    });
});

describe('applyDeadzone', () => {
    it('returns (0, 0) when within deadzone', () => {
        const result = applyDeadzone(0.05, 0.02, 0.15);
        expect(result).toEqual({ x: 0, y: 0 });
    });

    it('returns (0, 0) when exactly at deadzone boundary', () => {
        // magnitude = sqrt(0.1^2 + 0.1^2) ≈ 0.141, which is < 0.15
        const result = applyDeadzone(0.1, 0.1, 0.15);
        expect(result).toEqual({ x: 0, y: 0 });
    });

    it('passes through values outside deadzone', () => {
        const result = applyDeadzone(0.8, 0.5, 0.15);
        expect(result).toEqual({ x: 0.8, y: 0.5 });
    });

    it('passes through full displacement', () => {
        const result = applyDeadzone(1, 0, 0.15);
        expect(result).toEqual({ x: 1, y: 0 });
    });

    it('returns (0, 0) for zero input', () => {
        const result = applyDeadzone(0, 0, 0.15);
        expect(result).toEqual({ x: 0, y: 0 });
    });
});
