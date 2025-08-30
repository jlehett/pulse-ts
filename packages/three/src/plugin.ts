import * as THREE from 'three';
import {
    type World,
    type ServiceKey,
    maybeGetTransform,
    createTRS,
    type TRS,
    createServiceKey,
    maybeGetVisibility,
    CULLING_CAMERA,
    type CullingCamera,
    Node,
} from '@pulse-ts/core';
import { ThreeCameraPVSystem } from './systems/cameraPV';
import { ThreeTRSSyncSystem } from './systems/trsSync';
import {
    StatsOverlayOptions,
    StatsOverlaySystem,
} from './systems/statsOverlay';

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
    private serviceOff: (() => void) | null = null;
    private sysTickDisposer: { dispose(): void } | null = null;
    private roots = new Map<Node, RootRecord>();
    private resizeObs: ResizeObserver | null = null;

    private offParent: (() => void) | null = null;

    private projView = new THREE.Matrix4();
    private pvArray = new Float32Array(16);

    // plugin-managed systems
    private cameraPVSystem: ThreeCameraPVSystem | null = null;
    private trsSyncSystem: ThreeTRSSyncSystem | null = null;
    private statsSystem: StatsOverlaySystem | null = null;

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

    //#region Public Methods

    /**
     * Attaches the plugin to a world.
     * @param world The world to attach the plugin to.
     */
    attach(world: World) {
        if (this.world) throw new Error('ThreePlugin already attached.');
        this.world = world;
        this.serviceOff = world.provide(THREE_SERVICE, this);

        // World-level render tick
        this.sysTickDisposer = world.registerSystemTick(
            'frame',
            'late',
            () => this.render(),
            Number.MAX_SAFE_INTEGER,
        );
        // Camera PV system (frame:early)
        this.cameraPVSystem = new ThreeCameraPVSystem(
            this,
            Number.MIN_SAFE_INTEGER,
        );
        world.addSystem(this.cameraPVSystem);
        // TRS sync system (frame:late, before render)
        if (this.options.autoCommitTransforms) {
            this.trsSyncSystem = new ThreeTRSSyncSystem(
                this,
                Number.MAX_SAFE_INTEGER - 2,
            );
            world.addSystem(this.trsSyncSystem);
        }

        // Event-driven parenting (no per-frame scan)
        this.offParent = world.onNodeParentChanged(({ node, newParent }) => {
            const rec = this.roots.get(node);
            if (!rec) return;
            const target = newParent ? this.ensureRoot(newParent) : this.scene;
            if (rec.root.parent !== target) target.add(rec.root);
        });
    }

    /**
     * Detaches the plugin from a world.
     * @returns The plugin.
     */
    detach() {
        if (!this.world) return;
        this.sysTickDisposer?.dispose();
        this.sysTickDisposer = null;

        this.offParent?.();
        this.offParent = null;

        this.serviceOff?.();
        this.serviceOff = null;

        // clean scene/roots
        for (const { root } of this.roots.values()) this.scene.remove(root);
        this.roots.clear();

        this.resizeObs?.disconnect();
        this.resizeObs = null;

        // remove systems
        const w = this.world!;
        if (this.cameraPVSystem) {
            w.removeSystem(this.cameraPVSystem);
            this.cameraPVSystem = null;
        }
        if (this.trsSyncSystem) {
            w.removeSystem(this.trsSyncSystem);
            this.trsSyncSystem = null;
        }
        if (this.statsSystem) {
            w.removeSystem(this.statsSystem);
            this.statsSystem = null;
        }

        this.world = null;
    }

    /**
     * Ensures a root is attached to a node.
     * @param node The node to ensure a root is attached to.
     * @returns The root.
     */
    ensureRoot(node: Node): THREE.Object3D {
        let rec = this.roots.get(node);
        if (!rec) {
            const group = new THREE.Group();
            if (this.options.useMatrices) {
                group.matrixAutoUpdate = false;
            }
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
     * Attaches a child to a node.
     * @param node The node to attach the child to.
     * @param child The child to attach.
     */
    attachChild(node: Node, child: THREE.Object3D): void {
        const root = this.ensureRoot(node);
        root.add(child);
    }

    /**
     * Detaches a child from a node.
     * @param node The node to detach the child from.
     * @param child The child to detach.
     */
    detachChild(node: Node, child: THREE.Object3D): void {
        const rec = this.roots.get(node);
        if (!rec) return;
        rec.root.remove(child);
    }

    /**
     * Disposes a root.
     * @param node The node to dispose the root of.
     */
    disposeRoot(node: Node): void {
        const rec = this.roots.get(node);
        if (!rec) return;
        if (rec.root.parent) rec.root.parent.remove(rec.root);
        this.roots.delete(node);
    }

    /**
     * Renders the scene.
     */
    render(): void {
        if (!this.world) return;
        // TRS sync happens via ThreeTRSSyncSystem when enabled
        this.renderer.render(this.scene, this.camera);
    }

    /** Enable a single stats overlay per plugin/world. */
    enableStatsOverlay(opts?: StatsOverlayOptions): void {
        if (!this.world) return;
        if (this.statsSystem) return;
        this.statsSystem = new StatsOverlaySystem(this, opts);
        this.world.addSystem(this.statsSystem);
    }

    disableStatsOverlay(): void {
        if (!this.world || !this.statsSystem) return;
        this.world.removeSystem(this.statsSystem);
        this.statsSystem = null;
    }

    //#endregion

    //#region System Methods

    /**
     * Synchronizes the TRS of the roots.
     */
    syncTRS(): void {
        if (!this.world) return;
        const alpha = this.world.getAmbientAlpha();

        for (const [node, rec] of this.roots) {
            const t = maybeGetTransform(node);
            if (!t) continue;

            // Visibility from core culling (if enabled)
            if (this.options.enableCulling) {
                const v = maybeGetVisibility(node);
                const vis = v ? v.visible : true;
                rec.root.visible = vis;
                if (!vis) continue;
            } else {
                rec.root.visible = true;
            }

            if (alpha === 0) {
                // if world TRS cached version unchanged, skip touching Three
                t.getWorldTRS(rec.trs, 0); // fast when cached
                if (rec.lastWorldVersion == t.getWorldVersion?.()) {
                    continue;
                }
                rec.lastWorldVersion = t.getWorldVersion?.() ?? -1;

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

    /**
     * Pushes the camera PV to the world.
     */
    pushCameraPV(): void {
        if (!this.world) return;
        this.camera.updateMatrixWorld();
        this.projView.multiplyMatrices(
            this.camera.projectionMatrix,
            this.camera.matrixWorldInverse,
        );
        // copy into Float32Array
        const e = this.projView.elements as number[];
        for (let i = 0; i < 16; i++) this.pvArray[i] = e[i];
        this.world.provide(CULLING_CAMERA, {
            projView: this.pvArray,
        } as CullingCamera);
    }

    //#endregion

    //#region Private Methods

    /**
     * Resizes the canvas to the size of the renderer.
     */
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
