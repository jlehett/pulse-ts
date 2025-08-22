export class Vec3 {
    constructor(
        public x = 0,
        public y = 0,
        public z = 0,
    ) {}

    set(x: number, y: number, z: number): this {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }

    copy(v: Vec3): this {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;
        return this;
    }

    clone(): Vec3 {
        return new Vec3(this.x, this.y, this.z);
    }

    add(v: Vec3): this {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        return this;
    }

    sub(v: Vec3): this {
        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;
        return this;
    }

    scale(s: number): this {
        this.x *= s;
        this.y *= s;
        this.z *= s;
        return this;
    }

    static lerp(a: Vec3, b: Vec3, t: number, out = new Vec3()): Vec3 {
        const s = 1 - t;
        out.x = a.x * s + b.x * t;
        out.y = a.y * s + b.y * t;
        out.z = a.z * s + b.z * t;
        return out;
    }

    equals(v: Vec3): boolean {
        return this.x === v.x && this.y === v.y && this.z === v.z;
    }
}
