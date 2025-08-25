/**
 * 3-dimensional vector class.
 */
export class Vec3 {
    //#region Public Static Methods

    /**
     * Linear interpolation between two vectors.
     * @param a The first vector.
     * @param b The second vector.
     * @param t The interpolation factor (0..1).
     * @param out The vector to store the result in. If not provided, a new vector is created.
     * @returns The interpolated vector.
     */
    static lerp(a: Vec3, b: Vec3, t: number, out = new Vec3()): Vec3 {
        const s = 1 - t;
        out.x = a.x * s + b.x * t;
        out.y = a.y * s + b.y * t;
        out.z = a.z * s + b.z * t;
        return out;
    }

    //#endregion

    constructor(
        public x = 0,
        public y = 0,
        public z = 0,
    ) {}

    //#region Public Methods

    /**
     * Set the components of the vector.
     * @param x The x component.
     * @param y The y component.
     * @param z The z component.
     * @returns The vector.
     */
    set(x: number, y: number, z: number): this {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }

    /**
     * Copy the components of another vector.
     * @param v The vector to copy.
     * @returns The vector.
     */
    copy(v: Vec3): this {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;
        return this;
    }

    /**
     * Create a new vector with the same components.
     * @returns The cloned vector.
     */
    clone(): Vec3 {
        return new Vec3(this.x, this.y, this.z);
    }

    /**
     * Add another vector to this vector.
     * @param v The vector to add.
     * @returns The vector.
     */
    add(v: Vec3): this {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        return this;
    }

    /**
     * Subtract another vector from this vector.
     * @param v The vector to subtract.
     * @returns The vector.
     */
    sub(v: Vec3): this {
        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;
        return this;
    }

    /**
     * Scale the vector by a scalar.
     * @param s The scalar to scale by.
     * @returns The vector.
     */
    scale(s: number): this {
        this.x *= s;
        this.y *= s;
        this.z *= s;
        return this;
    }

    /**
     * Check if the vector is equal to another vector.
     * @param v The vector to compare.
     * @returns True if the vectors are equal; otherwise, false.
     */
    equals(v: Vec3): boolean {
        return this.x === v.x && this.y === v.y && this.z === v.z;
    }

    //#endregion
}
