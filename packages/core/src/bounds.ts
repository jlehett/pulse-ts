import { Vec3 } from './math/vec3';
import { Quat } from './math/quat';
import type { Node } from './node';
import { createTRS, type TRS, attachTransform } from './transform';
import { kBounds, kBoundsOwner, kWorldAddBounds } from './keys';

export interface AABB {
    min: Vec3;
    max: Vec3;
}

export function createAABB(): AABB {
    return { min: new Vec3(), max: new Vec3() };
}

/**
 * Bounds component: local AABB + cached world AABB + visibility flag.
 */
export class Bounds {
    [kBoundsOwner]!: Node;

    private _local: AABB | null = null;
    private _localVersion = 0;

    private _world = createAABB();
    private _cachedTRSVersion = -1;
    private _cachedLocalVersion = -1;

    private _scratchTRS: TRS = createTRS();
    private _corners = [
        new Vec3(),
        new Vec3(),
        new Vec3(),
        new Vec3(),
        new Vec3(),
        new Vec3(),
        new Vec3(),
        new Vec3(),
    ];

    visible = true;

    get owner(): Node {
        return this[kBoundsOwner];
    }

    /**
     * Sets the local bounds.
     * @param min The minimum point of the bounds.
     * @param max The maximum point of the bounds.
     */
    setLocal(min: Vec3, max: Vec3): void {
        if (!this._local) this._local = createAABB();
        this._local.min.copy(min);
        this._local.max.copy(max);
        this._localVersion++;
    }

    /**
     * Gets the local bounds.
     * @returns The local bounds.
     */
    getLocal(): AABB | null {
        return this._local;
    }

    /**
     * Gets the world bounds.
     * @param out The output bounds.
     * @param alpha The alpha for the interpolation.
     * @returns The world bounds.
     */
    getWorld(out?: AABB, alpha?: number): AABB | null {
        if (!this._local) return null;
        const transform = attachTransform(this.owner);

        const w = this.owner.world;
        const a = alpha ?? (w ? w.getAmbientAlpha() : 0);
        const trs = transform.getWorldTRS(this._scratchTRS, a);

        // Cache only for non-interpolated case using TRS world version and local bounds version
        const o = out ?? this._world;
        if (a === 0) {
            const worldVer = transform.getWorldVersion();
            if (
                this._cachedTRSVersion === worldVer &&
                this._cachedLocalVersion === this._localVersion
            ) {
                if (o !== this._world) {
                    o.min.copy(this._world.min);
                    o.max.copy(this._world.max);
                }
                return o;
            }
        }

        // Build 8 local corners
        const { min, max } = this._local;
        const cs = this._corners;
        cs[0].set(min.x, min.y, min.z);
        cs[1].set(max.x, min.y, min.z);
        cs[2].set(min.x, max.y, min.z);
        cs[3].set(max.x, max.y, min.z);
        cs[4].set(min.x, min.y, max.z);
        cs[5].set(max.x, min.y, max.z);
        cs[6].set(min.x, max.y, max.z);
        cs[7].set(max.x, max.y, max.z);

        // Transform corners: scale -> rotate -> translate
        let wminX = Infinity,
            wminY = Infinity,
            wminZ = Infinity;
        let wmaxX = -Infinity,
            wmaxY = -Infinity,
            wmaxZ = -Infinity;
        for (let i = 0; i < 8; i++) {
            cs[i].multiply(trs.scale);
            Quat.rotateVector(trs.rotation, cs[i], cs[i]);
            cs[i].x += trs.position.x;
            cs[i].y += trs.position.y;
            cs[i].z += trs.position.z;
            if (cs[i].x < wminX) wminX = cs[i].x;
            if (cs[i].x > wmaxX) wmaxX = cs[i].x;
            if (cs[i].y < wminY) wminY = cs[i].y;
            if (cs[i].y > wmaxY) wmaxY = cs[i].y;
            if (cs[i].z < wminZ) wminZ = cs[i].z;
            if (cs[i].z > wmaxZ) wmaxZ = cs[i].z;
        }
        o.min.x = wminX;
        o.min.y = wminY;
        o.min.z = wminZ;
        o.max.x = wmaxX;
        o.max.y = wmaxY;
        o.max.z = wmaxZ;

        if (a === 0) {
            this._world.min.copy(o.min);
            this._world.max.copy(o.max);
            this._cachedTRSVersion = transform.getWorldVersion();
            this._cachedLocalVersion = this._localVersion;
        }
        return o;
    }
}

/**
 * Attaches a bounds to a node.
 * @param node The node to attach the bounds to.
 * @returns The bounds.
 */
export function attachBounds(node: Node): Bounds {
    if ((node as any)[kBounds]) return (node as any)[kBounds];
    const b = new Bounds();
    Object.defineProperty(node, kBounds, { value: b, enumerable: false });
    (b as any)[kBoundsOwner] = node;
    if (node.world && (node.world as any)[kWorldAddBounds]) {
        (node.world as any)[kWorldAddBounds](b);
    } else {
        // also try explicit method if available
        (node.world as any)?.registerBounds?.(b);
    }
    return b;
}

/**
 * Gets the bounds attached to a node, if any.
 * @param node The node to get the bounds of.
 * @returns The bounds, or undefined if no bounds is attached.
 */
export function maybeGetBounds(node: Node): Bounds | undefined {
    return (node as any)[kBounds] as Bounds | undefined;
}
