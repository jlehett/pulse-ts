import { Quat } from './quat';
import { Vec3 } from './vec3';

describe('Quat', () => {
    test('multiply preserves unit length', () => {
        const a = new Quat(0, 0, 0, 1);
        const b = new Quat(0, Math.sin(Math.PI / 8), 0, Math.cos(Math.PI / 8));
        const out = Quat.multiply(a, b);
        const len = Math.hypot(out.x, out.y, out.z, out.w);
        expect(len).toBeCloseTo(1);
    });

    test('rotateVector 90deg around Z', () => {
        const q = new Quat(0, 0, Math.sin(Math.PI / 4), Math.cos(Math.PI / 4));
        const v = new Vec3(1, 0, 0);
        const r = Quat.rotateVector(q, v);
        expect(r.x).toBeCloseTo(0, 5);
        expect(r.y).toBeCloseTo(1, 5);
        expect(r.z).toBeCloseTo(0, 5);
    });

    test('slerp halfway between identity and 180deg Z', () => {
        const a = new Quat(0, 0, 0, 1);
        const b = new Quat(0, 0, 1, 0); // 180deg around Z axis
        const m = Quat.slerp(a, b, 0.5);
        // halfway should be 90deg around Z
        const v = new Vec3(1, 0, 0);
        const r = Quat.rotateVector(m, v);
        expect(r.x).toBeCloseTo(0, 5);
        expect(r.y).toBeCloseTo(1, 5);
        expect(r.z).toBeCloseTo(0, 5);
    });

    test('slerpInto matches slerp result', () => {
        const a = new Quat(0, 0, 0, 1);
        const b = new Quat(0, 0, 1, 0); // 180deg around Z axis
        const out = new Quat();
        const m = Quat.slerp(a, b, 0.25);
        Quat.slerpInto(a, b, 0.25, out);
        expect(out.x).toBeCloseTo(m.x, 5);
        expect(out.y).toBeCloseTo(m.y, 5);
        expect(out.z).toBeCloseTo(m.z, 5);
        expect(out.w).toBeCloseTo(m.w, 5);
    });
});
