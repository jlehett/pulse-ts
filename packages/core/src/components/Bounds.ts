import { Vec3 } from '../math/vec3';
import { Quat } from '../math/quat';
import type { Node } from '../node';
import { createTRS, type TRS, Transform } from './Transform';
import { attachComponent } from '../componentRegistry';
import { Component } from '../Component';

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
export class Bounds extends Component {
    static attach<Bounds>(owner: Node): Bounds {
        const b = super.attach(owner) as Bounds;
        return b;
    }

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

    /** Sets the local bounds. */
    setLocal(min: Vec3, max: Vec3): void {
        if (!this._local) this._local = createAABB();
        this._local.min.copy(min);
        this._local.max.copy(max);
        this._localVersion++;
    }

    /** Gets the local bounds. */
    getLocal(): AABB | null {
        return this._local;
    }

    /**
     * Gets the world bounds.
     * @param out The output bounds.
     * @param alpha The alpha for the interpolation.
     */
    getWorld(out?: AABB, alpha?: number): AABB | null {
        if (!this._local) return null;

        // ensure transform exists for owner
        const transform = attachComponent(this.owner, Transform);

        const w = (this.owner as any).world;
        const a = alpha ?? (w ? w.getAmbientAlpha?.() : 0);
        const trs = (transform as any).getWorldTRS(this._scratchTRS, a);

        // Cache only for non-interpolated case using TRS world version and local bounds version
        const o = out ?? this._world;
        if (a === 0) {
            const worldVer = (transform as any).getWorldVersion();
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
            this._cachedTRSVersion = (transform as any).getWorldVersion();
            this._cachedLocalVersion = this._localVersion;
        }
        return o;
    }
}
