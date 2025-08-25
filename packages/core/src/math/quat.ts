/**
 * Quaternion class.
 */
export class Quat {
    //#region Public Static Methods

    /**
     * Create a quaternion from Euler angles.
     * @param yaw The yaw angle in radians.
     * @param pitch The pitch angle in radians.
     * @param roll The roll angle in radians.
     * @returns The quaternion.
     */
    static fromEuler(yaw: number, pitch: number, roll: number): Quat {
        const cy = Math.cos(yaw * 0.5),
            sy = Math.sin(yaw * 0.5);
        const cx = Math.cos(pitch * 0.5),
            sx = Math.sin(pitch * 0.5);
        const cz = Math.cos(roll * 0.5),
            sz = Math.sin(roll * 0.5);
        const w = cy * cx * cz + sy * sx * sz;
        const x = cy * sx * cz + sy * cx * sz;
        const y = sy * cx * cz - cy * sx * sz;
        const z = cy * cx * sz - sy * sx * cz;
        return new Quat(x, y, z, w).normalize();
    }

    /**
     * Spherical linear interpolation between two quaternions.
     * @param a The first quaternion.
     * @param b The second quaternion.
     * @param t The interpolation factor (0..1).
     * @param out The quaternion to store the result in. If not provided, a new quaternion is created.
     * @returns The interpolated quaternion.
     */
    static slerp(a: Quat, b: Quat, t: number, out = new Quat()): Quat {
        let ax = a.x,
            ay = a.y,
            az = a.z,
            aw = a.w;
        let bx = b.x,
            by = b.y,
            bz = b.z,
            bw = b.w;
        let cos = ax * bx + ay * by + az * bz + aw * bw;
        if (cos < 0) {
            cos = -cos;
            bx = -bx;
            by = -by;
            bz = -bz;
            bw = -bw;
        }
        if (1 - cos < 1e-6) {
            out.x = ax + (bx - ax) * t;
            out.y = ay + (by - ay) * t;
            out.z = az + (bz - az) * t;
            out.w = aw + (bw - aw) * t;
            return out.normalize();
        }
        const theta = Math.acos(cos),
            sinTheta = Math.sin(theta);
        const s = Math.sin((1 - t) * theta) / sinTheta;
        const t2 = Math.sin(t * theta) / sinTheta;
        out.x = ax * s + bx * t2;
        out.y = ay * s + by * t2;
        out.z = ax * s + bz * t2;
        out.w = aw * s + bw * t2;
        return out.normalize();
    }

    //#endregion

    constructor(
        public x = 0,
        public y = 0,
        public z = 0,
        public w = 1,
    ) {}

    //#region Public Methods

    /**
     * Set the components of the quaternion.
     * @param x The x component.
     * @param y The y component.
     * @param z The z component.
     * @param w The w component.
     * @returns The quaternion.
     */
    set(x: number, y: number, z: number, w: number): this {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
        return this;
    }

    /**
     * Copy the components of another quaternion.
     * @param q The quaternion to copy.
     * @returns The quaternion.
     */
    copy(q: Quat): this {
        this.x = q.x;
        this.y = q.y;
        this.z = q.z;
        this.w = q.w;
        return this;
    }

    /**
     * Create a new quaternion with the same components.
     * @returns The cloned quaternion.
     */
    clone(): Quat {
        return new Quat(this.x, this.y, this.z, this.w);
    }

    /**
     * Normalize the quaternion.
     * @returns The normalized quaternion.
     */
    normalize(): this {
        const m = Math.hypot(this.x, this.y, this.z, this.w) || 1;
        this.x /= m;
        this.y /= m;
        this.z /= m;
        this.w /= m;
        return this;
    }

    /**
     * Check if the quaternion is equal to another quaternion.
     * @param q The quaternion to compare.
     * @returns True if the quaternions are equal; otherwise, false.
     */
    equals(q: Quat): boolean {
        return (
            this.x === q.x && this.y === q.y && this.z === q.z && this.w === q.w
        );
    }

    //#endregion
}
