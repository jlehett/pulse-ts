import { Vec3 } from '../math/vec3';
import type { World } from '../world';
import type { System } from './system';
import { createServiceKey, type ServiceKey } from '../keys';
import { maybeGetBounds } from '../bounds';
import { attachVisibility } from '../visibility';
import { attachTransform } from '../transform';

/**
 * A camera for frustum culling, represented by a projection-view matrix.
 */
export interface CullingCamera {
    projView: Float32Array; // length 16, column-major like Three.js
}

/**
 * The service key for the culling camera.
 */
export const CULLING_CAMERA: ServiceKey<CullingCamera> =
    createServiceKey<CullingCamera>('pulse:culling:camera');

/**
 * A plane for frustum culling.
 */
type Plane = { x: number; y: number; z: number; w: number };

/**
 * A frustum, represented by six planes. Planes are normalized and point outward.
 */
class Frustum {
    private planes: Plane[] = Array.from({ length: 6 }, () => ({
        x: 0,
        y: 0,
        z: 0,
        w: 0,
    }));

    /**
     * Sets the frustum from a projection-view matrix.
     * @param m The projection-view matrix.
     */
    setFromProjView(m: Float32Array): void {
        const me = m;
        // match Three.js extraction (column-major)
        this.setPlane(
            0,
            me[3] - me[0],
            me[7] - me[4],
            me[11] - me[8],
            me[15] - me[12],
        ); // right
        this.setPlane(
            1,
            me[3] + me[0],
            me[7] + me[4],
            me[11] + me[8],
            me[15] + me[12],
        ); // left
        this.setPlane(
            2,
            me[3] + me[1],
            me[7] + me[5],
            me[11] + me[9],
            me[15] + me[13],
        ); // bottom
        this.setPlane(
            3,
            me[3] - me[1],
            me[7] - me[5],
            me[11] - me[9],
            me[15] - me[13],
        ); // top
        this.setPlane(
            4,
            me[3] - me[2],
            me[7] - me[6],
            me[11] - me[10],
            me[15] - me[14],
        ); // far
        this.setPlane(
            5,
            me[3] + me[2],
            me[7] + me[6],
            me[11] + me[10],
            me[15] + me[14],
        ); // near
    }

    /**
     * Tests if the frustum intersects a bounds.
     * @param min The minimum point of the bounds.
     * @param max The maximum point of the bounds.
     * @returns True if the frustum intersects the bounds, false otherwise.
     */
    intersectsBounds(min: Vec3, max: Vec3): boolean {
        for (let i = 0; i < 6; i++) {
            const p = this.planes[i];
            // positive vertex
            const px = p.x >= 0 ? max.x : min.x;
            const py = p.y >= 0 ? max.y : min.y;
            const pz = p.z >= 0 ? max.z : min.z;
            if (p.x * px + p.y * py + p.z * pz + p.w < 0) return false;
        }
        return true;
    }

    /**
     * Sets a plane from a normal vector and a distance.
     * @param i The index of the plane.
     * @param x The x component of the normal vector.
     * @param y The y component of the normal vector.
     * @param z The z component of the normal vector.
     * @param w The distance from the origin to the plane.
     */
    private setPlane(i: number, x: number, y: number, z: number, w: number) {
        const invLen = 1 / (Math.hypot(x, y, z) || 1);
        this.planes[i].x = x * invLen;
        this.planes[i].y = y * invLen;
        this.planes[i].z = z * invLen;
        this.planes[i].w = w * invLen;
    }
}

/**
 * Iterates nodes with Bounds and updates Visibility from camera frustum.
 */
export class CullingSystem implements System {
    private frustum = new Frustum();
    private world!: World;
    private tick?: { dispose(): void };

    attach(world: World): void {
        this.world = world;
        this.tick = world.registerSystemTick('frame', 'update', () =>
            this.update(),
        );
    }

    detach(): void {
        this.tick?.dispose();
        this.tick = undefined;
        // @ts-expect-error clear
        this.world = undefined;
    }

    /**
     * Updates the frustum and culls nodes.
     * @returns True if the frustum intersects the bounds, false otherwise.
     */
    update(): void {
        const cam = this.world.getService(CULLING_CAMERA);
        if (!cam) return;
        this.frustum.setFromProjView(cam.projView);

        const nodes = this.world.nodes; // public set of nodes
        for (const n of nodes) {
            const b = maybeGetBounds(n);
            if (!b) continue;
            const aabb = b.getWorld();
            if (!aabb) {
                attachVisibility(n).visible = true;
                continue;
            }
            // ensure transform up-to-date for zero-alpha cache
            attachTransform(n).getWorldTRS(undefined, 0);
            attachVisibility(n).visible = this.frustum.intersectsBounds(
                aabb.min,
                aabb.max,
            );
        }
    }
}
