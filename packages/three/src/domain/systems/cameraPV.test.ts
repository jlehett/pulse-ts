/** @jest-environment jsdom */
import { World, CullingCamera } from '@pulse-ts/core';
import { ThreeService } from '../services/Three';
import { ThreeCameraPVSystem } from './cameraPV';

// Mock `three` with predictable matrix behavior
jest.mock('three', () => {
    class Object3D {}
    class Matrix4 {
        elements = Array.from({ length: 16 }, (_, i) => i + 1);
        multiplyMatrices() {
            // Overwrite with a recognizable value for assertion
            this.elements.fill(7);
            return this;
        }
    }
    class PerspectiveCamera extends Object3D {
        aspect = 1;
        projectionMatrix = new Matrix4();
        matrixWorldInverse = new Matrix4();
        updateProjectionMatrix() {}
        updateMatrixWorld() {}
    }
    class Scene extends Object3D {
        background: any;
    }
    class Color {
        constructor() {}
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
    return {
        Matrix4,
        PerspectiveCamera,
        Scene,
        Color,
        WebGLRenderer,
    };
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

test('ThreeCameraPVSystem publishes PV to CullingCamera service', () => {
    const world = new World();
    const svc = world.provideService(
        new ThreeService({ canvas: createCanvas() }),
    );
    const culling = world.provideService(
        new CullingCamera(new Float32Array(16)),
    );
    expect(culling.projView).toBeInstanceOf(Float32Array);

    const sys = world.addSystem(new ThreeCameraPVSystem());
    (sys as any).update();

    // Expect PV updated to 16-length float array with our recognizable value from mock
    expect(culling.projView).toBeInstanceOf(Float32Array);
    expect(culling.projView.length).toBe(16);
    // Our mock sets all values to 7
    expect(Array.from(culling.projView).every((v) => v === 7)).toBe(true);
    // Also ensure ThreeService was in play to silence ts unused var
    expect(svc).toBeTruthy();
});
