import * as THREE from 'three';
import type { World } from '@pulse-ts/core';
import { maybeGetTransform, Node, __worldRegisterTick } from '@pulse-ts/core';

export const THREE_SERVICE = Symbol('pulse:three');

type RootRecord = { root: THREE.Object3D };

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
        this.renderer.setPixelRatio(devicePixelRatio);

        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 10000);
        this.scene.background = new THREE.Color(this.options.clearColor);

        this.resizeToCanvas();
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
    }

    private resizeToCanvas() {
        const c = this.renderer.domElement;
        const w = c.clientWidth | 0,
            h = c.clientHeight | 0;
        if (c.width !== w || c.height !== h) {
            this.renderer.setSize(w, h, false);
            this.camera.aspect = w / (h || 1);
            this.camera.updateProjectionMatrix();
        }
    }

    ensureRoot(node: object): THREE.Object3D {
        let rec = this.roots.get(node);
        if (!rec) {
            const group = new THREE.Group();
            this.roots.set(node, { root: group });
            rec = this.roots.get(node)!;
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
            const { position, rotation, scale } = t.getLocalTRS();
            rec.root.position.set(position.x, position.y, position.z);
            rec.root.quaternion.set(
                rotation.x,
                rotation.y,
                rotation.z,
                rotation.w,
            );
            rec.root.scale.set(scale.x, scale.y, scale.z);
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
        this.resizeToCanvas();
        // heal parenting and sync transforms
        this.updateParenting();
        this.syncTRS();
        this.renderer.render(this.scene, this.camera);
    }
}
