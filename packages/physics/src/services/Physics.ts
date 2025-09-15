import { Service, TypedEvent, Vec3, getComponent, Transform } from '@pulse-ts/core';
import type { Node } from '@pulse-ts/core';
import { RigidBody } from '../components/RigidBody';
import { Collider } from '../components/Collider';
import type { PhysicsOptions, RaycastHit } from '../types';

export type CollisionPair = {
    aNode: Node;
    bNode: Node;
    normal: Vec3; // from a -> b
    depth: number;
};

/**
 * Minimal physics service: gravity + sphere collisions.
 */
export class PhysicsService extends Service {
    readonly options: Readonly<PhysicsOptions>;

    private gravity = new Vec3(0, -9.81, 0);
    private bodies = new Set<RigidBody>();
    private colliders = new Set<Collider>();
    private cellSize: number;

    // events (future): collision start/stop; for now expose a simple pulse per step
    readonly collisions = new TypedEvent<CollisionPair>();
    readonly collisionStart = new TypedEvent<CollisionPair>();
    readonly collisionEnd = new TypedEvent<CollisionPair>();

    private lastPairs = new Map<string, CollisionPair>();

    constructor(opts: PhysicsOptions = {}) {
        super();
        this.options = Object.freeze({ ...opts });
        const g = opts.gravity as any;
        if (g) this.gravity.set(g.x ?? 0, g.y ?? 0, g.z ?? 0);
        this.cellSize = Math.max(0.0001, opts.cellSize ?? 1);
    }

    attach(world: any): void {
        super.attach(world);
        // On attach, sweep existing nodes to auto-register any pre-existing bodies/colliders
        try {
            for (const n of (world as any).nodes as Set<Node>) {
                const rb = getComponent(n, RigidBody);
                if (rb) this.bodies.add(rb);
                const col = getComponent(n, Collider);
                if (col) this.colliders.add(col);
            }
        } catch {}
    }

    // Registration API for components
    registerRigidBody(rb: RigidBody): void {
        this.bodies.add(rb);
    }
    unregisterRigidBody(rb: RigidBody): void {
        this.bodies.delete(rb);
    }
    registerCollider(c: Collider): void {
        this.colliders.add(c);
    }
    unregisterCollider(c: Collider): void {
        this.colliders.delete(c);
    }

    /**
     * Advance physics simulation by dt seconds.
     */
    step(dt: number): void {
        const startPairs = new Map<string, CollisionPair>();
        const currentPairs = new Map<string, CollisionPair>();
        // 1) Integrate forces -> velocities (gravity)
        for (const rb of this.bodies) {
            if (!rb.owner?.world) continue;
            if (rb.type !== 'dynamic') continue;
            rb.linearVelocity.x += this.gravity.x * rb.gravityScale * dt;
            rb.linearVelocity.y += this.gravity.y * rb.gravityScale * dt;
            rb.linearVelocity.z += this.gravity.z * rb.gravityScale * dt;
            // damping (exponential decay approximation)
            if (rb.linearDamping > 0) {
                const f = Math.max(0, 1 - rb.linearDamping * dt);
                rb.linearVelocity.x *= f;
                rb.linearVelocity.y *= f;
                rb.linearVelocity.z *= f;
            }
        }

        // 2) Integrate velocities -> positions (+ optional world plane)
        const planeY = this.options.worldPlaneY;
        for (const rb of this.bodies) {
            const t = getComponent(rb.owner, Transform);
            if (!t) continue;
            if (rb.type === 'dynamic') t.localPosition.addScaled(rb.linearVelocity, dt);

            // Optional infinite ground plane
            if (planeY != null) {
                const col = getComponent(rb.owner, Collider);
                let radius = 0;
                if (col && col.kind === 'sphere') radius = col.radius;
                const bottom = t.localPosition.y + (col?.offset.y ?? 0) - radius;
                if (bottom < planeY) {
                    const pen = planeY - bottom;
                    t.localPosition.y += pen; // lift to plane
                    if (rb.type === 'dynamic') {
                        const e = Math.max(rb.restitution, col?.restitution ?? 0);
                        if (rb.linearVelocity.y < 0) rb.linearVelocity.y = -rb.linearVelocity.y * e;
                    }
                }
            }
        }

        // 3) Broadphase via uniform grid to generate candidate pairs
        const pairs = this.broadphasePairs();

        // 4) Narrowphase + resolution
        for (const [a, b] of pairs) {
            const info = this.narrowphase(a, b);
            if (!info) continue;
            const { nx, ny, nz, depth } = info;

            const key = this.pairKey(a.owner, b.owner);
            const pair: CollisionPair = {
                aNode: a.owner,
                bNode: b.owner,
                normal: new Vec3(nx, ny, nz),
                depth,
            };
            currentPairs.set(key, pair);
            if (!this.lastPairs.has(key)) startPairs.set(key, pair);

            const rbA = getComponent(a.owner, RigidBody);
            const rbB = getComponent(b.owner, RigidBody);
            const invMassA = rbA && rbA.type === 'dynamic' ? rbA.inverseMass : 0;
            const invMassB = rbB && rbB.type === 'dynamic' ? rbB.inverseMass : 0;
            const totalInv = invMassA + invMassB;

            // Skip resolution if trigger
            const triggered = a.isTrigger || b.isTrigger;
            if (!triggered && totalInv > 0) {
                // Positional correction
                const ta = getComponent(a.owner, Transform)!;
                const tb = getComponent(b.owner, Transform)!;
                const corrX = nx * depth;
                const corrY = ny * depth;
                const corrZ = nz * depth;
                if (invMassA > 0) {
                    const k = invMassA / totalInv;
                    ta.localPosition.x -= corrX * k;
                    ta.localPosition.y -= corrY * k;
                    ta.localPosition.z -= corrZ * k;
                }
                if (invMassB > 0) {
                    const k = invMassB / totalInv;
                    tb.localPosition.x += corrX * k;
                    tb.localPosition.y += corrY * k;
                    tb.localPosition.z += corrZ * k;
                }

                // Velocity impulse (elastic)
                const va = rbA?.linearVelocity ?? new Vec3();
                const vb = rbB?.linearVelocity ?? new Vec3();
                const rvx = vb.x - va.x;
                const rvy = vb.y - va.y;
                const rvz = vb.z - va.z;
                const vrel = rvx * nx + rvy * ny + rvz * nz;
                if (vrel < 0) {
                    const e = Math.max(
                        rbA?.restitution ?? 0.2,
                        rbB?.restitution ?? 0.2,
                        a.restitution ?? 0.2,
                        b.restitution ?? 0.2,
                    );
                    const j = (-(1 + e) * vrel) / (totalInv || 1);
                    const jx = nx * j;
                    const jy = ny * j;
                    const jz = nz * j;
                    if (invMassA > 0) {
                        va.x -= jx * invMassA;
                        va.y -= jy * invMassA;
                        va.z -= jz * invMassA;
                    }
                    if (invMassB > 0) {
                        vb.x += jx * invMassB;
                        vb.y += jy * invMassB;
                        vb.z += jz * invMassB;
                    }
                }
            }

            // Emit per-step collision pulse (stay)
            this.collisions.emit(pair);
        }

        // 5) Start/End events
        for (const [k, p] of currentPairs) if (!this.lastPairs.has(k)) this.collisionStart.emit(p);
        for (const [k, p] of this.lastPairs) if (!currentPairs.has(k)) this.collisionEnd.emit(p);
        this.lastPairs = currentPairs;
    }

    // --- Broadphase helpers ---
    private broadphasePairs(): Array<[Collider, Collider]> {
        const cs = this.cellSize;
        if (!isFinite(cs) || cs <= 0) return this.naivePairs();
        type CellKey = string;
        const buckets = new Map<CellKey, Collider[]>();
        const aabb = (c: Collider) => this.computeAABB(c);
        for (const c of this.colliders) {
            const bb = aabb(c);
            if (!bb) continue;
            const minx = Math.floor(bb.min.x / cs);
            const miny = Math.floor(bb.min.y / cs);
            const minz = Math.floor(bb.min.z / cs);
            const maxx = Math.floor(bb.max.x / cs);
            const maxy = Math.floor(bb.max.y / cs);
            const maxz = Math.floor(bb.max.z / cs);
            for (let x = minx; x <= maxx; x++)
                for (let y = miny; y <= maxy; y++)
                    for (let z = minz; z <= maxz; z++) {
                        const key = `${x},${y},${z}`;
                        let list = buckets.get(key);
                        if (!list) {
                            list = [];
                            buckets.set(key, list);
                        }
                        list.push(c);
                    }
        }
        const set = new Set<string>();
        const pairs: Array<[Collider, Collider]> = [];
        for (const list of buckets.values()) {
            for (let i = 0; i < list.length; i++)
                for (let j = i + 1; j < list.length; j++) {
                    const a = list[i]!;
                    const b = list[j]!;
                    const key = this.pairKey(a.owner, b.owner);
                    if (set.has(key)) continue;
                    set.add(key);
                    pairs.push([a, b]);
                }
        }
        if (pairs.length === 0) return this.naivePairs();
        return pairs;
    }

    private naivePairs(): Array<[Collider, Collider]> {
        const arr = [...this.colliders];
        const out: Array<[Collider, Collider]> = [];
        for (let i = 0; i < arr.length; i++)
            for (let j = i + 1; j < arr.length; j++) out.push([arr[i]!, arr[j]!]);
        return out;
    }

    private pairKey(a: Node, b: Node): string {
        const ai = a.id;
        const bi = b.id;
        return ai < bi ? `${ai}|${bi}` : `${bi}|${ai}`;
    }

    private computeAABB(c: Collider): { min: Vec3; max: Vec3 } | null {
        const t = getComponent(c.owner, Transform);
        if (!t) return null;
        const p = t.getWorldTRS().position;
        const cx = p.x + c.offset.x;
        const cy = p.y + c.offset.y;
        const cz = p.z + c.offset.z;
        if (c.kind === 'sphere') {
            const r = c.radius;
            return {
                min: new Vec3(cx - r, cy - r, cz - r),
                max: new Vec3(cx + r, cy + r, cz + r),
            };
        } else if (c.kind === 'box') {
            // Ignoring rotation for MVP (oriented AABB)
            return {
                min: new Vec3(cx - c.halfX, cy - c.halfY, cz - c.halfZ),
                max: new Vec3(cx + c.halfX, cy + c.halfY, cz + c.halfZ),
            };
        }
        return null;
    }

    private narrowphase(a: Collider, b: Collider):
        | { nx: number; ny: number; nz: number; depth: number }
        | null {
        const ta = getComponent(a.owner, Transform);
        const tb = getComponent(b.owner, Transform);
        if (!ta || !tb) return null;
        const pa = ta.getWorldTRS().position;
        const pb = tb.getWorldTRS().position;
        const ax = pa.x + a.offset.x;
        const ay = pa.y + a.offset.y;
        const az = pa.z + a.offset.z;
        const bx = pb.x + b.offset.x;
        const by = pb.y + b.offset.y;
        const bz = pb.z + b.offset.z;

        // Sphere-Sphere
        if (a.kind === 'sphere' && b.kind === 'sphere') {
            const dx = bx - ax;
            const dy = by - ay;
            const dz = bz - az;
            const rs = a.radius + b.radius;
            const d2 = dx * dx + dy * dy + dz * dz;
            if (d2 >= rs * rs) return null;
            const d = Math.sqrt(Math.max(1e-8, d2));
            return {
                nx: d > 0 ? dx / d : 0,
                ny: d > 0 ? dy / d : 1,
                nz: d > 0 ? dz / d : 0,
                depth: rs - d,
            };
        }

        // Sphere-Box (treat box as AABB)
        const sphereBox = (
            sx: number,
            sy: number,
            sz: number,
            r: number,
            bx0: number,
            by0: number,
            bz0: number,
            box: Collider,
        ) => {
            const minx = bx0 - box.halfX;
            const miny = by0 - box.halfY;
            const minz = bz0 - box.halfZ;
            const maxx = bx0 + box.halfX;
            const maxy = by0 + box.halfY;
            const maxz = bz0 + box.halfZ;
            const cx = Math.max(minx, Math.min(sx, maxx));
            const cy = Math.max(miny, Math.min(sy, maxy));
            const cz = Math.max(minz, Math.min(sz, maxz));
            const dx = sx - cx;
            const dy = sy - cy;
            const dz = sz - cz;
            const d2 = dx * dx + dy * dy + dz * dz;
            if (d2 > r * r) return null;
            const d = Math.sqrt(Math.max(1e-8, d2));
            let nx = dx / d, ny = dy / d, nz = dz / d;
            if (d === 0) {
                // choose face normal by shallowest penetration
                const px = Math.min(Math.abs(sx - minx), Math.abs(maxx - sx));
                const py = Math.min(Math.abs(sy - miny), Math.abs(maxy - sy));
                const pz = Math.min(Math.abs(sz - minz), Math.abs(maxz - sz));
                if (px <= py && px <= pz) nx = sx < (minx + maxx) * 0.5 ? -1 : 1, ny = 0, nz = 0;
                else if (py <= pz) nx = 0, ny = sy < (miny + maxy) * 0.5 ? -1 : 1, nz = 0;
                else nx = 0, ny = 0, nz = sz < (minz + maxz) * 0.5 ? -1 : 1;
            }
            return { nx, ny, nz, depth: r - d };
        };

        if (a.kind === 'sphere' && b.kind === 'box')
            return sphereBox(ax, ay, az, a.radius, bx, by, bz, b);
        if (a.kind === 'box' && b.kind === 'sphere') {
            const res = sphereBox(bx, by, bz, b.radius, ax, ay, az, a);
            if (!res) return null;
            return { nx: -res.nx, ny: -res.ny, nz: -res.nz, depth: res.depth };
        }

        // Box-Box (AABB overlap; pick smallest axis)
        if (a.kind === 'box' && b.kind === 'box') {
            const dx = (a.halfX + b.halfX) - Math.abs(bx - ax);
            if (dx <= 0) return null;
            const dy = (a.halfY + b.halfY) - Math.abs(by - ay);
            if (dy <= 0) return null;
            const dz = (a.halfZ + b.halfZ) - Math.abs(bz - az);
            if (dz <= 0) return null;
            // choose min penetration axis
            if (dx < dy && dx < dz)
                return { nx: Math.sign(bx - ax), ny: 0, nz: 0, depth: dx };
            if (dy < dz)
                return { nx: 0, ny: Math.sign(by - ay), nz: 0, depth: dy };
            return { nx: 0, ny: 0, nz: Math.sign(bz - az), depth: dz };
        }
        return null;
    }

    // --- Raycast ---
    raycast(origin: Vec3, dir: Vec3, maxDist = Infinity, filter?: (c: Collider) => boolean): RaycastHit | null {
        const ox = origin.x, oy = origin.y, oz = origin.z;
        const dx = dir.x, dy = dir.y, dz = dir.z;
        let best: { dist: number; node: Node; nx: number; ny: number; nz: number } | null = null;
        for (const c of this.colliders) {
            if (filter && !filter(c)) continue;
            const t = getComponent(c.owner, Transform);
            if (!t) continue;
            const p = t.getWorldTRS().position;
            const cx = p.x + c.offset.x;
            const cy = p.y + c.offset.y;
            const cz = p.z + c.offset.z;
            let hitDist: number | null = null;
            let n = { x: 0, y: 0, z: 0 };
            if (c.kind === 'sphere') {
                // Ray-sphere
                const lx = ox - cx, ly = oy - cy, lz = oz - cz;
                const b = lx * dx + ly * dy + lz * dz;
                const cterm = lx * lx + ly * ly + lz * lz - c.radius * c.radius;
                const disc = b * b - cterm;
                if (disc >= 0) {
                    const t0 = -b - Math.sqrt(disc);
                    const t1 = -b + Math.sqrt(disc);
                    const tHit = t0 >= 0 ? t0 : t1 >= 0 ? t1 : null;
                    if (tHit != null && tHit <= maxDist) {
                        hitDist = tHit;
                        const px = ox + dx * tHit - cx;
                        const py = oy + dy * tHit - cy;
                        const pz = oz + dz * tHit - cz;
                        const inv = 1 / Math.max(1e-8, Math.hypot(px, py, pz));
                        n = { x: px * inv, y: py * inv, z: pz * inv };
                    }
                }
            } else if (c.kind === 'box') {
                // Ray-AABB slab
                const minx = cx - c.halfX, maxx = cx + c.halfX;
                const miny = cy - c.halfY, maxy = cy + c.halfY;
                const minz = cz - c.halfZ, maxz = cz + c.halfZ;
                const invx = 1 / (dx || 1e-9);
                const invy = 1 / (dy || 1e-9);
                const invz = 1 / (dz || 1e-9);
                const tminx = (minx - ox) * invx;
                const tmaxx = (maxx - ox) * invx;
                const tminy = (miny - oy) * invy;
                const tmaxy = (maxy - oy) * invy;
                const tminz = (minz - oz) * invz;
                const tmaxz = (maxz - oz) * invz;
                const tmin = Math.max(
                    Math.min(tminx, tmaxx),
                    Math.min(tminy, tmaxy),
                    Math.min(tminz, tmaxz),
                );
                const tmax = Math.min(
                    Math.max(tminx, tmaxx),
                    Math.max(tminy, tmaxy),
                    Math.max(tminz, tmaxz),
                );
                if (tmax >= 0 && tmin <= tmax) {
                    const tHit = tmin >= 0 ? tmin : tmax; // if inside, exit point
                    if (tHit >= 0 && tHit <= maxDist) {
                        hitDist = tHit;
                        // approximate normal by which slab produced tmin
                        const eps = 1e-4;
                        const px = ox + dx * tHit;
                        const py = oy + dy * tHit;
                        const pz = oz + dz * tHit;
                        if (Math.abs(px - minx) < eps) n = { x: -1, y: 0, z: 0 };
                        else if (Math.abs(px - maxx) < eps) n = { x: 1, y: 0, z: 0 };
                        else if (Math.abs(py - miny) < eps) n = { x: 0, y: -1, z: 0 };
                        else if (Math.abs(py - maxy) < eps) n = { x: 0, y: 1, z: 0 };
                        else if (Math.abs(pz - minz) < eps) n = { x: 0, y: 0, z: -1 };
                        else if (Math.abs(pz - maxz) < eps) n = { x: 0, y: 0, z: 1 };
                    }
                }
            }
            if (hitDist != null && (!best || hitDist < best.dist))
                best = { dist: hitDist, node: c.owner, nx: n.x, ny: n.y, nz: n.z };
        }
        if (!best) return null;
        return {
            node: best.node,
            distance: best.dist,
            point: { x: origin.x + dir.x * best.dist, y: origin.y + dir.y * best.dist, z: origin.z + dir.z * best.dist },
            normal: { x: best.nx, y: best.ny, z: best.nz },
        };
    }
}
