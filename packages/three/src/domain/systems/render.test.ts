/** @jest-environment jsdom */
import { World } from '@pulse-ts/core';
import { ThreeService } from '../services/Three';
import { ThreeRenderSystem } from './render';

jest.mock('three', () => {
    class Object3D {}
    class Scene extends Object3D {
        background: any;
    }
    class Color {
        constructor() {}
    }
    class PerspectiveCamera extends Object3D {
        updateProjectionMatrix() {}
        updateMatrixWorld() {}
    }
    class WebGLRenderer {
        domElement: HTMLCanvasElement;
        setPixelRatio = jest.fn();
        setSize = jest.fn();
        render = jest.fn();
        constructor(opts: { canvas: HTMLCanvasElement }) {
            this.domElement = opts.canvas;
        }
    }
    return { Scene, Color, PerspectiveCamera, WebGLRenderer };
});

beforeAll(() => {
    // Stub ResizeObserver for jsdom
    (global as any).ResizeObserver = class {
        observe() {}
        disconnect() {}
    };
});

function createCanvas() {
    const canvas = document.createElement('canvas');
    Object.defineProperty(canvas, 'clientWidth', { value: 320 });
    Object.defineProperty(canvas, 'clientHeight', { value: 200 });
    return canvas as HTMLCanvasElement;
}

test('ThreeRenderSystem invokes renderer.render(scene, camera)', () => {
    const world = new World();
    const svc = world.provideService(
        new ThreeService({ canvas: createCanvas() }),
    );
    const sys = world.addSystem(new ThreeRenderSystem());

    (sys as any).update();

    const renderer = svc.renderer as unknown as { render: jest.Mock };
    expect(renderer.render).toHaveBeenCalledTimes(1);
});
