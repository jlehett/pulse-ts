import * as THREE from 'three';
import { Service } from '@pulse-ts/core';
import { Node, createTRS, type TRS, World } from '@pulse-ts/core';

export type RootRecord = {
    root: THREE.Object3D;
    trs: TRS;
    lastWorldVersion: number;
};

/**
 * Options for configuring the Three.js integration.
 */
export interface ThreeOptions {
    /**
     * The target canvas to render into.
     */
    canvas: HTMLCanvasElement;
    /**
     * Scene clear color (hex RGB). Default: `0x000000`.
     */
    clearColor?: number;
    /**
     * Auto-install `ThreeTRSSyncSystem` to push transforms before render. Default: `true`.
     */
    autoCommitTransforms?: boolean;
    /**
     * Use explicit matrix composition on roots (sets `matrixAutoUpdate=false`). Default: `false`.
     */
    useMatrices?: boolean;
    /**
     * Respect core `Visibility` to hide Three roots. Default: `true`.
     */
    enableCulling?: boolean;
}

/**
 * ThreeService: provides renderer/scene/camera and scene-graph bridging.
 *
 * - Lifecycles with the `World` as a `Service` (not a `System`).
 * - Focused systems (render, camera PV, TRS sync) consume this service.
 * - Encapsulates Node ↔ Object3D root mapping and parenting.
 *
 * @example
 * ```ts
 * import { World, Node } from '@pulse-ts/core';
 * import { ThreeService } from '@pulse-ts/three';
 *
 * const world = new World();
 * const canvas = document.createElement('canvas');
 * const three = world.provideService(new ThreeService({ canvas }));
 * const node = world.add(new Node());
 * const root = three.ensureRoot(node); // Object3D root for this node
 * ```
 */
export class ThreeService extends Service {
    readonly renderer: THREE.WebGLRenderer;
    readonly scene: THREE.Scene = new THREE.Scene();
    readonly camera: THREE.PerspectiveCamera;
    readonly options: Required<ThreeOptions>;

    private roots = new Map<Node, RootRecord>();
    private resizeObs: ResizeObserver | null = null;
    private offParent: (() => void) | null = null;
    private offRemoved: (() => void) | null = null;

    constructor(opts: ThreeOptions) {
        super();
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
        if (typeof window !== 'undefined' && 'ResizeObserver' in window) {
            this.resizeObs = new ResizeObserver(() => this.resizeToCanvas());
            this.resizeObs.observe(this.renderer.domElement);
        }
    }

    //#region Lifecycle Methods

    attach(world: World): void {
        super.attach(world);

        // Event-driven parenting (no per-frame scans)
        this.offParent = world.onNodeParentChanged(({ node, newParent }) => {
            const rec = this.roots.get(node);
            if (!rec) return;
            const target = newParent ? this.ensureRoot(newParent) : this.scene;
            if (rec.root.parent !== target) target.add(rec.root);
        });
        // Node lifecycle: dispose roots on removal
        this.offRemoved = world.onNodeRemoved((node) => this.disposeRoot(node));
    }

    detach(): void {
        this.offParent?.();
        this.offParent = null;
        this.offRemoved?.();
        this.offRemoved = null;

        for (const { root } of this.roots.values()) this.scene.remove(root);
        this.roots.clear();

        this.resizeObs?.disconnect();
        this.resizeObs = null;

        super.detach();
    }

    //#endregion

    //#region Public Methods

    /**
     * Ensures a root Object3D for the given node.
     * @param node The node to ensure a root for.
     * @returns The root `THREE.Object3D`.
     */
    ensureRoot(node: Node): THREE.Object3D {
        let rec = this.roots.get(node);
        if (!rec) {
            const group = new THREE.Group();
            if (this.options.useMatrices) group.matrixAutoUpdate = false;
            rec = { root: group, trs: createTRS(), lastWorldVersion: -1 };
            this.roots.set(node, rec);

            // Attach under current parent (or scene)
            const parent = node.parent;
            const target = parent ? this.ensureRoot(parent) : this.scene;
            if (rec.root.parent !== target) target.add(rec.root);
        }
        return rec.root;
    }

    /**
     * Attaches a child `Object3D` to the root of the given node.
     * @param node The node to attach the child to.
     * @param child The child `Object3D` to attach.
     */
    attachChild(node: Node, child: THREE.Object3D): void {
        const root = this.ensureRoot(node);
        root.add(child);
    }

    /**
     * Detaches a child `Object3D` from the root of the given node.
     * @param node The node to detach the child from.
     * @param child The child `Object3D` to detach.
     */
    detachChild(node: Node, child: THREE.Object3D): void {
        const rec = this.roots.get(node);
        if (!rec) return;
        rec.root.remove(child);
    }

    /**
     * Disposes the root `Object3D` for the given node and removes it from the scene graph.
     * @param node The node to dispose the root for.
     */
    disposeRoot(node: Node): void {
        const rec = this.roots.get(node);
        if (!rec) return;
        if (rec.root.parent) rec.root.parent.remove(rec.root);
        this.roots.delete(node);
    }

    /**
     * Iterates node→root records managed by the service.
     * @returns Iterator of `[Node, RootRecord]` entries.
     */
    iterateRoots(): IterableIterator<[Node, RootRecord]> {
        return this.roots.entries();
    }

    //#endregion

    //#region Private Methods

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

    //#endregion
}
