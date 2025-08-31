import * as THREE from 'three';
import { __fcCurrent, useFrameLate } from '@pulse-ts/core';
import { ThreePlugin } from '../plugin';

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
    const plugin = world.getSystem(ThreePlugin);
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
    const { node, destroy } = __fcCurrent();
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
    const { node, destroy } = __fcCurrent();
    plugin.attachChild(node, object);
    destroy?.push(() => plugin.detachChild(node, object));
}

export function useCulledObject3D(object: THREE.Object3D): void {
    const { plugin } = useThreeContext();
    const { node } = __fcCurrent();
    const root = plugin.ensureRoot(node);

    // Each frame, mirror the root's visibility decided by the ThreePlugin culler
    useFrameLate(() => {
        object.visible = root.visible;
    });
}
