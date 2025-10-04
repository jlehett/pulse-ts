/** @jest-environment jsdom */
import { World, Node } from '@pulse-ts/core';
import { ThreeService } from './Three';

// Lightweight mock for the `three` module used by ThreeService
jest.mock('three', () => {
    class Vector3 {
        x = 0;
        y = 0;
        z = 0;
        set(x: number, y: number, z: number) {
            this.x = x;
            this.y = y;
            this.z = z;
        }
        copy(v: Vector3) {
            this.x = v.x;
            this.y = v.y;
            this.z = v.z;
        }
        multiply(v: Vector3) {
            this.x *= v.x;
            this.y *= v.y;
            this.z *= v.z;
        }
    }
    class Quaternion {
        x = 0;
        y = 0;
        z = 0;
        w = 1;
        set(x: number, y: number, z: number, w: number) {
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;
        }
        copy(q: Quaternion) {
            this.x = q.x;
            this.y = q.y;
            this.z = q.z;
            this.w = q.w;
        }
    }
    class Object3D {
        parent: Object3D | null = null;
        children: Object3D[] = [];
        position = new Vector3();
        quaternion = new Quaternion();
        scale = new Vector3();
        visible = true;
        matrixAutoUpdate = true;
        matrixWorldNeedsUpdate = false as boolean;
        add(child: Object3D) {
            if (child.parent) child.parent.remove(child);
            this.children.push(child);
            child.parent = this;
        }
        remove(child: Object3D) {
            const i = this.children.indexOf(child);
            if (i >= 0) this.children.splice(i, 1);
            if (child.parent === this) child.parent = null;
        }
        updateMatrix() {}
    }
    class Group extends Object3D {}
    class Scene extends Object3D {
        background: any;
    }
    class Matrix4 {
        elements = Array.from({ length: 16 }, () => 0);
        multiplyMatrices() {
            this.elements.fill(42); // recognizable test value
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
    class Color {
        value: number;
        constructor(v: number) {
            this.value = v;
        }
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
        Vector3,
        Quaternion,
        Object3D,
        Group,
        Scene,
        Matrix4,
        PerspectiveCamera,
        Color,
        WebGLRenderer,
    };
});

function createCanvas(width = 300, height = 150) {
    const canvas = document.createElement('canvas');
    Object.defineProperty(canvas, 'clientWidth', { value: width });
    Object.defineProperty(canvas, 'clientHeight', { value: height });
    return canvas as HTMLCanvasElement;
}

beforeAll(() => {
    // Stub ResizeObserver for jsdom
    (global as any).ResizeObserver = class {
        observe() {}
        disconnect() {}
    };
});

describe('ThreeService', () => {
    test('initializes renderer, scene background, and camera aspect', () => {
        const world = new World();
        const canvas = createCanvas(640, 360);

        const svc = world.provideService(
            new ThreeService({
                canvas,
                clearColor: 0x123456,
                useMatrices: true,
            }),
        );

        // Background color
        expect((svc.scene.background as any).value).toBe(0x123456);

        // Camera aspect after resizeToCanvas
        expect(svc.camera.aspect).toBeCloseTo(640 / 360);
    });

    test('ensureRoot creates root and respects parenting', () => {
        const world = new World();
        const svc = world.provideService(
            new ThreeService({ canvas: createCanvas() }),
        );

        const parent = world.add(new Node());
        const child = world.add(new Node());

        // Create child root first (common case in FCs)
        const childRoot = svc.ensureRoot(child);
        expect(childRoot.parent).toBe(svc.scene);

        // Now parent child under parent node: root should reparent under parent's root
        const parentRoot = svc.ensureRoot(parent);
        parent.addChild(child);
        expect(childRoot.parent).toBe(parentRoot);
    });
});
