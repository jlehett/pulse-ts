import * as THREE from 'three';
import type { World, ServiceKey } from '@pulse-ts/core';
import {
    maybeGetTransform,
    createTRS,
    type TRS,
    createServiceKey,
    maybeGetVisibility,
    CULLING_CAMERA,
    type CullingCamera,
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

    private projView = new THREE.Matrix4();
    private pvArray = new Float32Array(16);

    // stats overlay (optional)
    private statsEl: HTMLDivElement | null = null;
    private statsTick: { dispose(): void } | null = null;
    private statsAcc = 0;
    private statsInterval = 300; // ms

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
        world.setService(THREE_SERVICE, this);

        // World-level system ticks
        this.sysTickDisposer = world.registerSystemTick(
            'frame',
            'late',
            () => this.render(),
            Number.MAX_SAFE_INTEGER,
        );
        // push camera PV before update phase so culling system can read
        world.registerSystemTick(
            'frame',
            'early',
            () => this.pushCameraPV(),
            Number.MIN_SAFE_INTEGER,
        );

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

        this.world.setService(THREE_SERVICE, undefined as any);
        this.world = null;

        // clean scene/roots
        for (const { root } of this.roots.values()) this.scene.remove(root);
        this.roots.clear();

        this.resizeObs?.disconnect();
        this.resizeObs = null;

        this.disableStatsOverlay();
    }

    /**
     * Ensures a root is attached to a node.
     * @param node The node to ensure a root is attached to.
     * @returns The root.
     */
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

    /**
     * Attaches a child to a node.
     * @param node The node to attach the child to.
     * @param child The child to attach.
     */
    attachChild(node: object, child: THREE.Object3D): void {
        const root = this.ensureRoot(node);
        root.add(child);
    }

    /**
     * Detaches a child from a node.
     * @param node The node to detach the child from.
     * @param child The child to detach.
     */
    detachChild(node: object, child: THREE.Object3D): void {
        const rec = this.roots.get(node);
        if (!rec) return;
        rec.root.remove(child);
    }

    /**
     * Disposes a root.
     * @param node The node to dispose the root of.
     */
    disposeRoot(node: object): void {
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

        if (this.options.autoCommitTransforms) {
            this.syncTRS();
        }

        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Enable a stats overlay that displays the FPS and fixed SPS.
     */
    enableStatsOverlay(opts?: {
        position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
        background?: string;
        color?: string;
        font?: string;
        pad?: string;
        zIndex?: string | number;
        updateMs?: number; // default 300ms
    }): void {
        if (!this.world) return;
        if (this.statsEl) return; // already enabled
        const container =
            this.renderer.domElement.parentElement ?? document.body;
        if (getComputedStyle(container).position === 'static') {
            (container as HTMLElement).style.position = 'relative';
        }
        const el = document.createElement('div');
        const pos = opts?.position ?? 'top-left';
        const bg = opts?.background ?? 'rgba(0,0,0,0.4)';
        const color = opts?.color ?? '#0f0';
        const font = opts?.font ?? '12px monospace';
        const pad = opts?.pad ?? '2px 6px';
        const z = String(opts?.zIndex ?? 1000);
        Object.assign(el.style, {
            position: 'absolute',
            left: pos.endsWith('left') ? '4px' : '',
            right: pos.endsWith('right') ? '4px' : '',
            top: pos.startsWith('top') ? '4px' : '',
            bottom: pos.startsWith('bottom') ? '4px' : '',
            background: bg,
            color,
            font,
            padding: pad,
            zIndex: z,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
        } as Partial<CSSStyleDeclaration>);
        container.appendChild(el);
        this.statsEl = el as HTMLDivElement;
        this.statsInterval = Math.max(50, opts?.updateMs ?? 300);
        this.statsAcc = 0;
        this.statsTick = this.world.registerSystemTick(
            'frame',
            'late',
            (dt) => this.updateStats(dt),
            Number.MAX_SAFE_INTEGER - 1,
        );
    }

    /**
     * Disables the stats overlay.
     */
    disableStatsOverlay(): void {
        this.statsTick?.dispose();
        this.statsTick = null;
        this.statsEl?.remove();
        this.statsEl = null;
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

    /**
     * Synchronizes the TRS of the roots.
     */
    private syncTRS(): void {
        if (!this.world) return;
        const alpha = this.world.getAmbientAlpha();

        for (const [node, rec] of this.roots) {
            const t = maybeGetTransform(node as any);
            if (!t) continue;

            // Visibility from core culling (if enabled)
            if (this.options.enableCulling) {
                const v = maybeGetVisibility(node as any);
                const vis = v ? v.visible : true;
                rec.root.visible = vis;
                if (!vis) continue;
            } else {
                rec.root.visible = true;
            }

            if (alpha === 0) {
                // if world TRS cached version unchanged, skip touching Three
                t.getWorldTRS(rec.trs, 0); // fast when cached
                if (rec.lastWorldVersion === (t as any).getWorldVersion?.()) {
                    continue;
                }
                rec.lastWorldVersion = (t as any).getWorldVersion?.() ?? -1;

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
    private pushCameraPV(): void {
        if (!this.world) return;
        this.camera.updateMatrixWorld();
        this.projView.multiplyMatrices(
            this.camera.projectionMatrix,
            this.camera.matrixWorldInverse,
        );
        // copy into Float32Array
        const e = this.projView.elements as any as number[];
        for (let i = 0; i < 16; i++) this.pvArray[i] = e[i];
        this.world.setService(CULLING_CAMERA, {
            projView: this.pvArray,
        } as CullingCamera);
    }

    /**
     * Updates the stats overlay.
     * @param dt The delta time.
     */
    private updateStats(dt: number): void {
        if (!this.world || !this.statsEl) return;
        this.statsAcc += dt * 1000;
        if (this.statsAcc < this.statsInterval) return;
        this.statsAcc = 0;
        const perf = (this.world as any).getPerf?.();
        if (!perf) return;
        const { fps, fixedSps } = perf;
        this.statsEl.textContent = `fps ${fps.toFixed(0)}  fixed ${fixedSps.toFixed(0)}`;
    }

    //#endregion
}
