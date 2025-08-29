import * as THREE from 'three';
import type { World } from '@pulse-ts/core';
import {
    maybeGetTransform,
    Node,
    __worldRegisterTick,
    createTRS,
    type TRS,
} from '@pulse-ts/core';

export const THREE_SERVICE = Symbol('pulse:three');

type RootRecord = { root: THREE.Object3D; trs: TRS };

export interface ThreePluginOptions {
    canvas: HTMLCanvasElement;
    clearColor?: number;
    autoCommitTransforms?: boolean; // default true
}

export class ThreePlugin {
    readonly renderer: THREE.WebGLRenderer;
    readonly scene: THREE.Scene = new THREE.Scene();
    readonly camera: THREE.PerspectiveCamera;
    readonly options: Required<ThreePluginOptions>;

    private world: World | null = null;
    private renderDriver: { dispose(): void } | null = null;
    private roots = new Map<object, RootRecord>();
    private resizeObs: ResizeObserver | null = null;

    constructor(opts: ThreePluginOptions) {
        this.options = {
            clearColor: 0x000000,
            autoCommitTransforms: true,
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

        // create a driver node so the scheduler will run
        const driver = new Node();
        world.add(driver);
        const reg = world[__worldRegisterTick](
            driver,
            'frame',
            'late',
            () => this.render(),
            Number.MAX_SAFE_INTEGER,
        );

        this.renderDriver = {
            dispose: () => {
                reg.active = false;
                world.remove(driver);
            },
        };
    }

    detach() {
        if (!this.world) return;
        this.renderDriver?.dispose();
        this.renderDriver = null;
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
            rec = { root: group, trs: createTRS() };
            this.roots.set(node, rec);
        }
        // ensure parent root exists and re-parent immediately
        const parent = (node as any).parent;
        const targetParent: THREE.Object3D = parent
            ? this.ensureRoot(parent)
            : this.scene;
        if (rec.root.parent !== targetParent) targetParent.add(rec.root);
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

    private updateParenting(): void {
        for (const [node, rec] of this.roots) {
            const parent = (node as any).parent;
            const targetParent = parent ? this.ensureRoot(parent) : this.scene;
            if (rec.root.parent !== targetParent) targetParent.add(rec.root);
        }
    }

    private syncTRS(): void {
        for (const [node, rec] of this.roots) {
            const t = maybeGetTransform(node as any);
            if (!t) continue;
            // write interpolated *local* TRS into our reusable container
            t.getLocalTRS(rec.trs);
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
        }
    }

    disposeRoot(node: object): void {
        const rec = this.roots.get(node);
        if (!rec) return;
        if (rec.root.parent) rec.root.parent.remove(rec.root);
        this.roots.delete(node);
        // heal parenting for children that referenced this node as parent
        this.updateParenting();
    }

    render(): void {
        if (!this.world) return;
        // parenting changes can happen outside Three; keep it consistent
        this.updateParenting();

        if (this.options.autoCommitTransforms) {
            this.syncTRS();
        }
        this.renderer.render(this.scene, this.camera);
    }
}
