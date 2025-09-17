/**
 * A 3-dimensional vector.
 */
export class Vec3 {
    constructor(
        public x = 0,
        public y = 0,
        public z = 0,
    ) {}

    /**
     * Returns a clone of the vector.
     */
    clone(): Vec3 {
        return new Vec3(this.x, this.y, this.z);
    }

    /**
     * Sets the vector to the given values.
     */
    set(x: number, y: number, z: number): this {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }

    /**
     * Normalizes the vector.
     */
    normalize(): this {
        const l = Math.hypot(this.x, this.y, this.z) || 1;
        this.x /= l;
        this.y /= l;
        this.z /= l;
        return this;
    }

    /**
     * Copies the values of the given vector.
     */
    copy(v: Vec3): this {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;
        return this;
    }

    /**
     * Adds a scaled vector to the vector.
     */
    addScaled(v: Vec3, s: number): this {
        this.x += v.x * s;
        this.y += v.y * s;
        this.z += v.z * s;
        return this;
    }

    /**
     * Multiplies the vector by the given vector.
     */
    multiply(v: Vec3): this {
        this.x *= v.x;
        this.y *= v.y;
        this.z *= v.z;
        return this;
    }

    /**
     * Linearly interpolates between two vectors.
     */
    static lerp(a: Vec3, b: Vec3, t: number): Vec3 {
        return new Vec3(
            a.x + (b.x - a.x) * t,
            a.y + (b.y - a.y) * t,
            a.z + (b.z - a.z) * t,
        );
    }

    /**
     * Linearly interpolates between two vectors and stores the result in the given output vector.
     */
    static lerpInto(a: Vec3, b: Vec3, t: number, out: Vec3): Vec3 {
        out.x = a.x + (b.x - a.x) * t;
        out.y = a.y + (b.y - a.y) * t;
        out.z = a.z + (b.z - a.z) * t;
        return out;
    }
}
