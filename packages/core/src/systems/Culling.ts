import { Vec3 } from '../math/vec3';
import type { World } from '../world';
import { getComponent, attachComponent } from '../componentRegistry';
import { Bounds } from '../components/Bounds';
import { Visibility } from '../components/Visibility';
import { Transform } from '../components/Transform';
import { CullingCamera } from '../services/CullingCamera';
import { System } from '../System';
import { UpdateKind, UpdatePhase } from '../types';

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
export class CullingSystem extends System {
    static updateKind: UpdateKind = 'frame';
    static updatePhase: UpdatePhase = 'update';

    private frustum = new Frustum();

    /**
     * Updates the frustum and culls nodes.
     * @returns True if the frustum intersects the bounds, false otherwise.
     */
    update(): void {
        if (!this.world) return;

        const cam = this.world.getService(CullingCamera);
        if (!cam) return;
        this.frustum.setFromProjView(cam.projView);

        const nodes = this.world.nodes; // public set of nodes
        for (const n of nodes) {
            const b = getComponent(n, Bounds);
            if (!b) continue;
            const aabb = b.getWorld();
            if (!aabb) {
                attachComponent(n, Visibility).visible = true;
                continue;
            }
            // ensure transform up-to-date for zero-alpha cache
            attachComponent(n, Transform).getWorldTRS(undefined, 0);
            attachComponent(n, Visibility).visible =
                this.frustum.intersectsBounds(aabb.min, aabb.max);
        }
    }
}
