import * as THREE from 'three';
import { __fcCurrent, useFrameLate } from '@pulse-ts/core';
import { ThreeService } from '../services/Three';

/**
 * Returns Three.js context bound to the current `World`.
 *
 * - Throws if the `ThreeService` is not provided to the world.
 * - Provides access to the shared renderer, scene, and camera.
 *
 * @returns The plugin and core Three objects.
 */
export function useThreeContext(): {
    service: ThreeService;
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.Camera;
} {
    const world = __fcCurrent().world;
    const service = world.getService(ThreeService);
    if (!service) throw new Error('ThreeService not provided to world.');
    return {
        service,
        renderer: service.renderer,
        scene: service.scene,
        camera: service.camera,
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
    const { service } = useThreeContext();
    const { node, destroy } = __fcCurrent();
    const root = service.ensureRoot(node);
    destroy?.push(() => {
        service.disposeRoot(node);
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
    const { service } = useThreeContext();
    const { node, destroy } = __fcCurrent();
    service.attachChild(node, object);
    destroy?.push(() => service.detachChild(node, object));
}
