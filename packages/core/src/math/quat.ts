import { Vec3 } from './vec3';

/**
 * A quaternion.
 */
export class Quat {
    constructor(
        public x = 0,
        public y = 0,
        public z = 0,
        public w = 1,
    ) {}

    /**
     * Returns a clone of the quaternion.
     */
    clone(): Quat {
        return new Quat(this.x, this.y, this.z, this.w);
    }

    /**
     * Sets the quaternion to the given values.
     */
    set(x: number, y: number, z: number, w: number): this {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
        return this;
    }

    /**
     * Normalizes the quaternion.
     */
    normalize(): this {
        const l = Math.hypot(this.x, this.y, this.z, this.w) || 1;
        this.x /= l;
        this.y /= l;
        this.z /= l;
        this.w /= l;
        return this;
    }

    /**
     * Copies the values of the given quaternion.
     */
    copy(q: Quat): this {
        this.x = q.x;
        this.y = q.y;
        this.z = q.z;
        this.w = q.w;
        return this;
    }

    /**
     * Multiplies two quaternions.
     */
    static multiply(a: Quat, b: Quat, out = new Quat()): Quat {
        const ax = a.x,
            ay = a.y,
            az = a.z,
            aw = a.w,
            bx = b.x,
            by = b.y,
            bz = b.z,
            bw = b.w;
        out.x = aw * bx + ax * bw + ay * bz - az * by;
        out.y = aw * by - ax * bz + ay * bw + az * bx;
        out.z = aw * bz + ax * by - ay * bx + az * bw;
        out.w = aw * bw - ax * bx - ay * by - az * bz;
        return out.normalize();
    }

    /**
     * Rotates a vector by the quaternion.
     */
    static rotateVector(q: Quat, v: Vec3, out = new Vec3()): Vec3 {
        const x = v.x,
            y = v.y,
            z = v.z,
            qx = q.x,
            qy = q.y,
            qz = q.z,
            qw = q.w;
        const ix = qw * x + qy * z - qz * y;
        const iy = qw * y + qz * x - qx * z;
        const iz = qw * z + qx * y - qy * x;
        const iw = -qx * x - qy * y - qz * z;
        out.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
        out.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
        out.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
        return out;
    }

    /**
     * Spherically interpolates between two quaternions.
     */
    static slerp(a: Quat, b: Quat, t: number): Quat {
        // minimal slerp; for small angles falls back to lerp+normalize
        let cos = a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
        let by = new Quat(b.x, b.y, b.z, b.w);
        if (cos < 0) {
            cos = -cos;
            by.set(-b.x, -b.y, -b.z, -b.w);
        }
        if (1 - cos < 1e-6) {
            return new Quat(
                a.x + (by.x - a.x) * t,
                a.y + (by.y - a.y) * t,
                a.z + (by.z - a.z) * t,
                a.w + (by.w - a.w) * t,
            ).normalize();
        }
        const sin = Math.sqrt(1 - cos * cos);
        const ang = Math.atan2(sin, cos);
        const s1 = Math.sin((1 - t) * ang) / sin;
        const s2 = Math.sin(t * ang) / sin;
        return new Quat(
            a.x * s1 + by.x * s2,
            a.y * s1 + by.y * s2,
            a.z * s1 + by.z * s2,
            a.w * s1 + by.w * s2,
        );
    }
}
