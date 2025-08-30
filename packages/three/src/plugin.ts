import * as THREE from 'three';
import type { World, ServiceKey } from '@pulse-ts/core';
import {
    maybeGetTransform,
    Node,
    __worldRegisterTick,
    createTRS,
    type TRS,
    createServiceKey,
} from '@pulse-ts/core';

export const THREE_SERVICE: ServiceKey<ThreePlugin> =
    createServiceKey<ThreePlugin>('pulse:three');

type RootRecord = { root: THREE.Object3D; trs: TRS; lastWorldVersion: number };

export interface ThreePluginOptions {
    canvas: HTMLCanvasElement;
    clearColor?: number;
    autoCommitTransforms?: boolean; // default true
    useMatrices?: boolean; // default false - disable matrixAutoUpdate and compose explicitly
    enableCulling?: boolean; // default true
}

export class ThreePlugin {
    readonly renderer: THREE.WebGLRenderer;
    readonly scene: THREE.Scene = new THREE.Scene();
    readonly camera: THREE.PerspectiveCamera;
    readonly options: Required<ThreePluginOptions>;

    private world: World | null = null;
    private sysTickDisposer: { dispose(): void } | null = null;
    private roots = new Map<object, RootRecord>();
    private resizeObs: ResizeObserver | null = null;

    private offParent: (() => void) | null = null;

    private frustum = new THREE.Frustum();
    private projView = new THREE.Matrix4();
    private tmpBox = new THREE.Box3();

    constructor(opts: ThreePluginOptions) {
        this.options = {
            clearColor: 0x000000,
            autoCommitTransforms: true,
            useMatrices: false,
            enableCulling: true,
            ...opts,
        };

        this.renderer = new THREE.WebGLRenderer({
            canvas: opts.canvas,
            antialias: true,
        });
        if (typeof devicePixelRatio === 'number') {
            this.renderer.setPixelRatio(devicePixelRatio);
        }

        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 10000);
        this.scene.background = new THREE.Color(this.options.clearColor);

        this.resizeToCanvas();
        // observe size changes without per-frame reads
        if ('ResizeObserver' in window) {
            this.resizeObs = new ResizeObserver(() => this.resizeToCanvas());
            this.resizeObs.observe(this.renderer.domElement);
        }
    }

    attach(world: World) {
        if (this.world) throw new Error('ThreePlugin already attached.');
        this.world = world;
        world.setService(THREE_SERVICE, this);

        // World-level system tick
        this.sysTickDisposer = world.registerSystemTick(
            'frame',
            'late',
            () => this.render(),
            Number.MAX_SAFE_INTEGER,
        );

        // Event-driven parenting (no per-frame scan)
        this.offParent = world.onNodeParentChanged(({ node, newParent }) => {
            const rec = this.roots.get(node);
            if (!rec) return;
            const target = newParent ? this.ensureRoot(newParent) : this.scene;
            if (rec.root.parent !== target) target.add(rec.root);
        });
    }

    detach() {
        if (!this.world) return;
        this.sysTickDisposer?.dispose();
        this.sysTickDisposer = null;

        this.offParent?.();
        this.offParent = null;

        this.world.setService(THREE_SERVICE, undefined as any);
        this.world = null;

        // clean scene/roots
        for (const { root } of this.roots.values()) this.scene.remove(root);
        this.roots.clear();

        this.resizeObs?.disconnect();
        this.resizeObs = null;
    }

    private resizeToCanvas() {
        const c = this.renderer.domElement;
        const w = c.clientWidth | 0,
            h = c.clientHeight | 0;
        if (w > 0 && h > 0 && (c.width !== w || c.height !== h)) {
            this.renderer.setSize(w, h, false);
            this.camera.aspect = w / (h || 1);
            this.camera.updateProjectionMatrix();
        }
    }

    ensureRoot(node: object): THREE.Object3D {
        let rec = this.roots.get(node);
        if (!rec) {
            const group = new THREE.Group();
            if (this.options.useMatrices) {
                group.matrixAutoUpdate = false;
            }
            rec = { root: group, trs: createTRS(), lastWorldVersion: -1 };
            this.roots.set(node, rec);

            // Attach under current parent (or scene)
            const parent = (node as any).parent;
            const target = parent ? this.ensureRoot(parent) : this.scene;
            if (rec.root.parent !== target) target.add(rec.root);
        }
        return rec.root;
    }

    attachChild(node: object, child: THREE.Object3D): void {
        const root = this.ensureRoot(node);
        root.add(child);
    }

    detachChild(node: object, child: THREE.Object3D): void {
        const rec = this.roots.get(node);
        if (!rec) return;
        rec.root.remove(child);
    }

    private syncTRS(): void {
        if (!this.world) return;
        const alpha = this.world.getAmbientAlpha();

        for (const [node, rec] of this.roots) {
            const t = maybeGetTransform(node as any);
            if (!t) continue;

            // Frustum culling (skip TRS sync when not visible)
            if (this.options.enableCulling) {
                const aabb = t.getWorldAABB(
                    undefined,
                    this.world!.getAmbientAlpha(),
                );
                if (aabb) {
                    this.tmpBox.min.set(aabb.min.x, aabb.min.y, aabb.min.z);
                    this.tmpBox.max.set(aabb.max.x, aabb.max.y, aabb.max.z);
                    const vis = this.frustum.intersectsBox(this.tmpBox);
                    rec.root.visible = vis;
                    if (!vis) continue;
                } else {
                    rec.root.visible = true; // no AABB -> assume visible
                }
            }

            if (alpha === 0) {
                // if world TRS cached version unchanged, skip touching Three
                t.getWorldTRS(rec.trs, 0); // fast when cached
                if (rec.lastWorldVersion === (t as any)._worldVersion) {
                    continue;
                }
                rec.lastWorldVersion = (t as any)._worldVersion;

                // We still apply *local* TRS to Three (graph composes it)
                // But rec.trs hold world; recompute local quickly:
                t.getLocalTRS(rec.trs, 0);
            } else {
                // With interpolation, always update (values change very frame)
                t.getLocalTRS(rec.trs, alpha);
                rec.lastWorldVersion = -1; // invalid
            }

            rec.root.position.set(
                rec.trs.position.x,
                rec.trs.position.y,
                rec.trs.position.z,
            );
            rec.root.quaternion.set(
                rec.trs.rotation.x,
                rec.trs.rotation.y,
                rec.trs.rotation.z,
                rec.trs.rotation.w,
            );
            rec.root.scale.set(
                rec.trs.scale.x,
                rec.trs.scale.y,
                rec.trs.scale.z,
            );
            if (this.options.useMatrices) {
                rec.root.updateMatrix();
                rec.root.matrixWorldNeedsUpdate = true;
            }
        }
    }

    disposeRoot(node: object): void {
        const rec = this.roots.get(node);
        if (!rec) return;
        if (rec.root.parent) rec.root.parent.remove(rec.root);
        this.roots.delete(node);
    }

    render(): void {
        if (!this.world) return;

        if (this.options.enableCulling) {
            this.camera.updateMatrixWorld();
            this.projView.multiplyMatrices(
                this.camera.projectionMatrix,
                this.camera.matrixWorldInverse,
            );
            this.frustum.setFromProjectionMatrix(this.projView);
        }

        if (this.options.autoCommitTransforms) {
            this.syncTRS();
        }

        this.renderer.render(this.scene, this.camera);
    }
}
