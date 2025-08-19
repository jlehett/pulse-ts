import { Node, World } from '@pulse-ts/core';
import * as Three from 'three';
import { Renderable } from '../../classes/Renderable';

export interface RenderingSystemProps {
    canvas: HTMLCanvasElement;
}

export class RenderingSystem extends Node {
    private canvas: HTMLCanvasElement;
    private scene: Three.Scene;
    private mainCamera?: Three.PerspectiveCamera;
    private _renderer?: Three.WebGLRenderer;

    constructor(world: World, props: RenderingSystemProps) {
        super(world);
        this.canvas = props.canvas;
        this.scene = new Three.Scene();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onUpdate(_delta: number): void {
        if (this.renderer && this.mainCamera) {
            this.renderer.render(this.scene, this.mainCamera);
        }
    }

    setMainCamera(camera: Three.PerspectiveCamera) {
        this.mainCamera = camera;
    }

    addRenderable(renderable: Renderable) {
        this.scene.add(renderable.mesh);
    }

    removeRenderable(renderable: Renderable) {
        this.scene.remove(renderable.mesh);
    }

    private get renderer(): Three.WebGLRenderer | undefined {
        if (!this.mainCamera) return;

        if (!this._renderer) {
            this._renderer = new Three.WebGLRenderer({ canvas: this.canvas });
            this._renderer.setSize(window.innerWidth, window.innerHeight);

            window.addEventListener('resize', () => {
                if (this._renderer) {
                    this._renderer.setSize(
                        window.innerWidth,
                        window.innerHeight,
                    );
                }

                if (this.mainCamera) {
                    this.mainCamera.aspect =
                        window.innerWidth / window.innerHeight;
                    this.mainCamera.updateProjectionMatrix();
                }
            });
        }

        return this._renderer;
    }
}
