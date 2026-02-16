import { Vec3 } from './vec3';

describe('Vec3', () => {
    test('normalize', () => {
        const v = new Vec3(3, 4, 0).normalize();
        expect(Math.hypot(v.x, v.y, v.z)).toBeCloseTo(1);
    });

    test('lerp and lerpInto', () => {
        const a = new Vec3(0, 0, 0);
        const b = new Vec3(10, -10, 5);
        const mid = Vec3.lerp(a, b, 0.5);
        expect(mid.x).toBeCloseTo(5);
        expect(mid.y).toBeCloseTo(-5);
        expect(mid.z).toBeCloseTo(2.5);

        const out = new Vec3();
        Vec3.lerpInto(a, b, 0.25, out);
        expect(out.x).toBeCloseTo(2.5);
        expect(out.y).toBeCloseTo(-2.5);
        expect(out.z).toBeCloseTo(1.25);
    });
});
