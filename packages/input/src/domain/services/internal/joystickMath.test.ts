import {
    computeDisplacement,
    applyDeadzone,
    clampToRadius,
} from './joystickMath';

describe('computeDisplacement', () => {
    test('returns zero displacement when touch is at center', () => {
        const d = computeDisplacement(60, 60, 60, 60);
        expect(d.dx).toBe(0);
        expect(d.dy).toBe(0);
        expect(d.distance).toBe(0);
    });

    test('computes positive X displacement', () => {
        const d = computeDisplacement(60, 60, 90, 60);
        expect(d.dx).toBe(30);
        expect(d.dy).toBe(0);
        expect(d.distance).toBe(30);
        expect(d.angle).toBeCloseTo(0);
    });

    test('computes negative Y displacement (up in screen coords)', () => {
        const d = computeDisplacement(60, 60, 60, 30);
        expect(d.dx).toBe(0);
        expect(d.dy).toBe(-30);
        expect(d.distance).toBe(30);
        expect(d.angle).toBeCloseTo(-Math.PI / 2);
    });

    test('computes diagonal displacement', () => {
        const d = computeDisplacement(0, 0, 3, 4);
        expect(d.distance).toBeCloseTo(5);
        expect(d.angle).toBeCloseTo(Math.atan2(4, 3));
    });
});

describe('applyDeadzone', () => {
    test('returns zero output when within deadzone', () => {
        const d = computeDisplacement(60, 60, 62, 60); // 2px, well within deadzone
        const out = applyDeadzone(d, 50, 0.15); // dzRadius = 7.5
        expect(out.x).toBe(0);
        expect(out.y).toBe(0);
        expect(out.magnitude).toBe(0);
    });

    test('returns zero when exactly at deadzone boundary', () => {
        const dzRadius = 0.15 * 50; // 7.5
        const d = computeDisplacement(60, 60, 60 + dzRadius, 60);
        const out = applyDeadzone(d, 50, 0.15);
        expect(out.magnitude).toBeCloseTo(0);
    });

    test('returns full magnitude at max radius', () => {
        const d = computeDisplacement(60, 60, 110, 60); // 50px = maxRadius
        const out = applyDeadzone(d, 50, 0.15);
        expect(out.magnitude).toBeCloseTo(1);
        expect(out.x).toBeCloseTo(1);
        expect(out.y).toBeCloseTo(0);
    });

    test('clamps magnitude to 1 when beyond max radius', () => {
        const d = computeDisplacement(60, 60, 200, 60); // way beyond
        const out = applyDeadzone(d, 50, 0.15);
        expect(out.magnitude).toBeCloseTo(1);
        expect(out.x).toBeCloseTo(1);
    });

    test('linearly rescales between deadzone and max', () => {
        const maxRadius = 100;
        const deadzone = 0.2;
        const dzRadius = 20; // 0.2 * 100
        const midDistance = (dzRadius + maxRadius) / 2; // 60, halfway
        const d = computeDisplacement(0, 0, midDistance, 0);
        const out = applyDeadzone(d, maxRadius, deadzone);
        expect(out.magnitude).toBeCloseTo(0.5);
    });

    test('handles zero deadzone', () => {
        const d = computeDisplacement(0, 0, 25, 0);
        const out = applyDeadzone(d, 50, 0);
        expect(out.magnitude).toBeCloseTo(0.5);
        expect(out.x).toBeCloseTo(0.5);
    });

    test('returns zero for zero maxRadius', () => {
        const d = computeDisplacement(0, 0, 10, 10);
        const out = applyDeadzone(d, 0, 0.15);
        expect(out.x).toBe(0);
        expect(out.y).toBe(0);
        expect(out.magnitude).toBe(0);
    });

    test('handles diagonal displacement correctly', () => {
        // 45-degree angle, distance = 50 (at max)
        const dist = 50;
        const dx = dist * Math.cos(Math.PI / 4);
        const dy = dist * Math.sin(Math.PI / 4);
        const d = computeDisplacement(0, 0, dx, dy);
        const out = applyDeadzone(d, 50, 0.15);
        expect(out.magnitude).toBeCloseTo(1);
        // x and y should be equal for 45 degrees
        expect(Math.abs(out.x - out.y)).toBeLessThan(0.001);
    });
});

describe('clampToRadius', () => {
    test('returns original offsets when within radius', () => {
        const result = clampToRadius(3, 4, 10);
        expect(result.x).toBe(3);
        expect(result.y).toBe(4);
    });

    test('clamps to radius boundary when exceeding', () => {
        const result = clampToRadius(100, 0, 50);
        expect(result.x).toBeCloseTo(50);
        expect(result.y).toBeCloseTo(0);
    });

    test('preserves direction when clamping', () => {
        const result = clampToRadius(-100, 0, 50);
        expect(result.x).toBeCloseTo(-50);
        expect(result.y).toBeCloseTo(0);
    });

    test('clamps diagonal correctly', () => {
        // 3-4-5 triangle scaled to distance 10, radius 5
        const result = clampToRadius(6, 8, 5);
        const dist = Math.sqrt(result.x * result.x + result.y * result.y);
        expect(dist).toBeCloseTo(5);
        // Should preserve ratio
        expect(result.x / result.y).toBeCloseTo(6 / 8);
    });

    test('returns exact values when at boundary', () => {
        const result = clampToRadius(3, 4, 5); // distance exactly 5
        expect(result.x).toBe(3);
        expect(result.y).toBe(4);
    });
});
