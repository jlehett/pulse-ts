import type { World } from '@pulse-ts/core';
import type { Scene, WebGLRenderer, Camera } from 'three';

export interface ThreeViewContext {
    world: World;
    scene: Scene;
    renderer: WebGLRenderer;
    activeCamera: Camera;
    alpha: number;
}