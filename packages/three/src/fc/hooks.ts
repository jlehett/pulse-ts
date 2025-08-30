import * as THREE from 'three';
import { __fcCurrent, useFrameLate, useWorld } from '@pulse-ts/core';
import { ThreePlugin, THREE_SERVICE } from '../plugin';

/**
 * Returns Three.js context bound to the current `World`.
 *
 * - Throws if the `ThreePlugin` is not attached to the world.
 * - Provides access to the shared renderer, scene, and camera.
 *
 * @returns The plugin and core Three objects.
 */
export function useThreeContext(): {
    plugin: ThreePlugin;
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.Camera;
} {
    const world = __fcCurrent().world;
    const plugin = world.getService(THREE_SERVICE);
    if (!plugin) throw new Error('ThreePlugin not attached to world.');
    return {
        plugin,
        renderer: plugin.renderer,
        scene: plugin.scene,
        camera: plugin.camera,
    };
}

/**
 * Ensures and returns the `Object3D` root associated with the current component's `Node`.
 *
 * - The root is kept parented to the `Object3D` of the parent `Node`, or the scene.
 * - On component destroy, the root is disposed and removed from the scene graph.
 *
 * @returns The `Object3D` root for the current `Node`.
 */
export function useThreeRoot(): THREE.Object3D {
    const { plugin } = useThreeContext();
    const { node, destroy } = __fcCurrent() as any;
    const root = plugin.ensureRoot(node);
    destroy?.push(() => {
        plugin.disposeRoot(node);
    });
    return root;
}

/**
 * Attaches an `Object3D` to the current component's root for the lifetime of the component.
 *
 * - The object is added as a child of the component's root.
 * - On component destroy, the object is removed.
 *
 * @param object The `THREE.Object3D` to attach.
 */
export function useObject3D(object: THREE.Object3D): void {
    const { plugin } = useThreeContext();
    const { node, destroy } = __fcCurrent() as any;
    plugin.attachChild(node, object);
    destroy?.push(() => plugin.detachChild(node, object));
}

export function useCulledObject3D(object: THREE.Object3D): void {
    const { plugin } = useThreeContext();
    const { node } = __fcCurrent() as any;
    const root = plugin.ensureRoot(node);

    // Each frame, mirror the root's visibility decided by the ThreePlugin culler
    useFrameLate(() => {
        object.visible = root.visible;
    });
}

/**
 * Adds a lightweight DOM overlay showing FPS and fixed steps/sec.
 * The overlay is attached next to the renderer canvas and updates periodically.
 */
export function useStatsOverlay(opts?: {
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    background?: string;
    color?: string;
    font?: string;
    pad?: string;
    zIndex?: string | number;
    updateMs?: number; // default 300ms
}): void {
    const { plugin } = useThreeContext();
    const world = useWorld();
    const { destroy } = __fcCurrent() as any;

    const container = plugin.renderer.domElement.parentElement ?? document.body;
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
    destroy?.push(() => el.remove());

    let acc = 0;
    const interval = Math.max(50, opts?.updateMs ?? 300);
    useFrameLate((dt) => {
        acc += dt * 1000;
        if (acc < interval) return;
        acc = 0;
        const { fps, fixedSps } = (world as any).getPerf?.() ?? {
            fps: 0,
            fixedSps: 0,
        };
        el.textContent = `fps ${fps.toFixed(0)}  fixed ${fixedSps.toFixed(0)}`;
    });
}
