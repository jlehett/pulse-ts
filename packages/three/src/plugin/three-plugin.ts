import type { World, Node } from '@pulse-ts/core';
import { hasTransform } from '@pulse-ts/core';
import { RendererDriverNode } from './renderer-driver-node';
import { ObjectMap } from './object-map';
import { getPrefab } from '../decorators/three-prefab';
import { applyLocalTRSToObject3D } from '../adapters/transform-sync';
import { attachObject3D, detachObject3D } from '../utils/object-handle';
import type { ThreeViewContext } from '../utils/types';
import {
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    Group,
    type Object3D,
    type Material
} from 'three';

export interface ThreePluginOptions {
    canvas?: HTMLCanvasElement;
    antialias?: boolean;
    alpha?: boolean;
    preserveDrawingBuffer?: boolean;
    devicePixelRatio?: number;
    autoResize?: boolean;
    clearColor?: number | null;
    fov?: number; near?: number; far?: number;
    scene?: Scene; camera?: PerspectiveCamera; renderer?: WebGLRenderer;
    onConfigureRenderer?(renderer: WebGLRenderer): void;
    onConfigureScene?(scene: Scene): void;
}

export class ThreePlugin {
    readonly scene: Scene;
    readonly camera: PerspectiveCamera;
    readonly renderer: WebGLRenderer;

    private world: World | null = null;
    private readonly objectMap = new ObjectMap();
    private readonly driver: RendererDriverNode;
    private autoResize = true;
    private lastW = 0; private lastH = 0;

    constructor(options: ThreePluginOptions = {}) {
        this.scene = options.scene ?? new Scene();
        options.onConfigureScene?.(this.scene);

        this.camera = options.camera ?? new PerspectiveCamera(options.fov ?? 60, 1, options.near ?? 0.1, options.far ?? 1000);
        this.camera.position.set(0, 2, 5);

        this.renderer = options.renderer ?? new WebGLRenderer({
            canvas: options.canvas,
            antialias: options.antialias ?? true,
            alpha: options.alpha ?? true, preserveDrawingBuffer: options.preserveDrawingBuffer ?? false
        });
        const dpr = options.devicePixelRatio ?? (typeof window !== 'undefined' ? window.devicePixelRatio : 1);
        this.renderer.setPixelRatio(dpr);
        if (options.clearColor != null) this.renderer.setClearColor(options.clearColor);
        options.onConfigureRenderer?.(this.renderer);

        this.autoResize = options.autoResize ?? true;
        if (this.autoResize) this.resizeToCanvas();

        this.driver = new RendererDriverNode((dt) => this.render(dt));
    }

    attach(world: World): void {
        if (this.world) throw new Error('ThreePlugin already attached');
        this.world = world;

        world.add(this.driver);

        // Lifecycle & hierarchy events
        world.onNodeAdded.subscribe(n => {
            this.attachIfRenderable(n);
            this.reparentChildrenIfReady(n);
        });
        world.onNodeRemoved.subscribe(n => this.detachIfRenderable(n));
        world.onParentChanged.subscribe(({ node }) => this.updateParentAttachment(node));

        // Seed
        for (const n of world.nodes.values()) this.attachIfRenderable(n);
        for (const n of world.nodes.values()) this.reparentChildrenIfReady(n);

        if (this.autoResize && typeof window !== 'undefined') {
            window.addEventListener('resize', this.handleResize);
        }
    }

    detach(): void {
        if (!this.world) return;
        this.world.remove(this.driver);
        for (const [id, obj] of this.objectMap.entries()) { obj.removeFromParent(); disposeObject3D(obj);}
        this.objectMap.clear();
        if (typeof window !== 'undefined') window.removeEventListener('resize', this.handleResize);
        this.world = null;
    }

    private makeContext(): ThreeViewContext {
        const world = this.world!;
        return {
            world,
            scene: this.scene,
            renderer: this.renderer,
            activeCamera: this.camera,
            alpha: world.getInterpolationAlpha?.() ?? 0,
        };
    }

    private attachIfRenderable(node: Node): void {
        if (!this.world) return;

        // Decide if we render the node: prefab OR has transform
        const prefab = getPrefab(node);
        const shouldRender = !!prefab || hasTransform(node);
        if (!shouldRender || this.objectMap.has(node)) return;

        const object: Object3D = prefab ? prefab(node, this.makeContext()) : new Group();
        this.objectMap.set(node, object);
        attachObject3D(node, object);

        // Parent into scene graph now; will be re-evaluated on hierarchy events too
        this.updateParentAttachment(node);

        // Initial sync of TRS if node has transform
        try {
            applyLocalTRSToObject3D(node, object, this.makeContext());
        } catch {
            // okay if no transform
        }
    }

    private detachIfRenderable(node: Node): void {
        const obj = this.objectMap.delete(node);
        if (!obj) return;
        obj.removeFromParent();
        disposeObject3D(obj);
        detachObject3D(node);
    }

    private updateParentAttachment(node: Node): void {
        const obj = this.objectMap.get(node); if (!obj) return;
        const parentObj = node.parent ? this.objectMap.get(node.parent) : null;
        const desiredParent: Object3D = parentObj ?? this.scene;
        if (obj.parent !== desiredParent) desiredParent.add(obj);
    }

    private reparentChildrenIfReady(node: Node): void {
        const obj = this.objectMap.get(node); if (!obj) return;
        for (const child of node.children) {
            const childObj = this.objectMap.get(child);
            if (childObj && childObj.parent !== obj) obj.add(childObj);
        }
    }

    render(deltaSeconds: number): void {
        if (!this.world) return;
        if (this.autoResize) this.resizeToCanvas();

        const ctx = this.makeContext();

        // Sync TRS on every object that has Transform
        for (const n of this.world.nodes.values()) {
            const o = this.objectMap.get(n);
            if (!o) continue;
            try {
                applyLocalTRSToObject3D(n, o, ctx);
            } catch {
                /* ignore nodes without transform */
            }
        }

        this.renderer.render(this.scene, this.camera);
    }

    private handleResize = () => this.resizeToCanvas();

    private resizeToCanvas(): void {
        const canvas = this.renderer.domElement;
        const w = canvas.clientWidth || canvas.width;
        const h = canvas.clientHeight || canvas.height;
        if (w === 0 || h === 0) return;
        if (w !== this.lastW || h !== this.lastH) {
            this.lastW = w;
            this.lastH = h;
            this.renderer.setSize(w, h, false);
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
        }
    }
}

function disposeObject3D(object: Object3D): void {
    object.traverse((child: any) => {
        if (child.geometry) child.geometry.dispose?.();
        if (child.material) {
            if (Array.isArray(child.material)) child.material.forEach((m: Material)  => m.dispose?.());
            else child.material.dispose?.();
        }
        if (child.dispose) child.dispose();
    });
}