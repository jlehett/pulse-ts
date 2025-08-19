import type { Module, World } from '@pulse-ts/core';
import * as Three from 'three';
import { Renderable } from '../classes/Renderable';
import { RenderingSystem } from './systems/RenderingSystem';

export class ThreeModule implements Module {
    private world?: World;
    private renderingSystem?: RenderingSystem;

    constructor(private canvas: HTMLCanvasElement) {}

    onInit(world: World) {
        this.world = world;
        this.renderingSystem = this.world.createNode(RenderingSystem, {
            canvas: this.canvas,
        });
    }

    setMainCamera(camera: Three.PerspectiveCamera) {
        this.renderingSystem?.setMainCamera(camera);
    }

    addRenderable(renderable: Renderable) {
        this.renderingSystem?.addRenderable(renderable);
    }

    removeRenderable(renderable: Renderable) {
        this.renderingSystem?.removeRenderable(renderable);
    }
}
