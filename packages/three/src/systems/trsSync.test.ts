/** @jest-environment jsdom */
import { World, Node, Transform } from '@pulse-ts/core';
import { useComponent } from '@pulse-ts/core';
import { ThreeService } from '../services/Three';
import { ThreeTRSSyncSystem } from './trsSync';

// Mock `three` for deterministic, DOM-free behavior
jest.mock('three', () => {
    class Vector3 {
        x = 0;
        y = 0;
        z = 0;
        constructor(x = 0, y = 0, z = 0) {
            this.x = x;
            this.y = y;
            this.z = z;
        }
        set(x: number, y: number, z: number) {
            this.x = x;
            this.y = y;
            this.z = z;
        }
        multiply(v: Vector3) {
            this.x *= v.x;
            this.y *= v.y;
            this.z *= v.z;
        }
        copy(v: Vector3) {
            this.x = v.x;
            this.y = v.y;
            this.z = v.z;
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
        scale = new Vector3(1, 1, 1);
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
    class Scene extends Object3D {}
    class Matrix4 {
        elements = Array.from({ length: 16 }, () => 0);
    }
    class PerspectiveCamera extends Object3D {
        aspect = 1;
        projectionMatrix = new Matrix4();
        matrixWorldInverse = new Matrix4();
        updateProjectionMatrix() {}
        updateMatrixWorld() {}
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

function createCanvas() {
    const canvas = document.createElement('canvas');
    Object.defineProperty(canvas, 'clientWidth', { value: 320 });
    Object.defineProperty(canvas, 'clientHeight', { value: 200 });
    return canvas as HTMLCanvasElement;
}

beforeAll(() => {
    // Stub ResizeObserver for jsdom
    (global as any).ResizeObserver = class {
        observe() {}
        disconnect() {}
    };
});

describe('ThreeTRSSyncSystem', () => {
    test('writes Transform local TRS to Object3D root', () => {
        const world = new World();
        const svc = world.provideService(
            new ThreeService({ canvas: createCanvas(), enableCulling: false }),
        );
        const sys = world.addSystem(new ThreeTRSSyncSystem());
        expect(sys).toBeDefined();

        // Mount a node with Transform and set local values
        let nodeRef: Node | null = null;
        let tRef: Transform | null = null;
        function Entity() {
            const t = useComponent(Transform);
            t.setLocal({
                position: { x: 1, y: 2, z: 3 },
                rotationQuat: { x: 0, y: 0.707, z: 0, w: 0.707 },
                scale: { x: 2, y: 3, z: 4 },
            });
            // capture node/transform
            tRef = t;
        }
        nodeRef = world.mount(Entity);
        // ensure a Three root exists for this node
        const root = svc.ensureRoot(nodeRef);

        // Manually invoke TRS sync
        (sys as any).update();

        expect(root.position).toMatchObject({ x: 1, y: 2, z: 3 });
        expect(root.quaternion).toMatchObject({
            x: 0,
            y: 0.707,
            z: 0,
            w: 0.707,
        });
        expect(root.scale).toMatchObject({ x: 2, y: 3, z: 4 });
        expect(tRef).not.toBeNull();
    });

    // Note: Hiding based on core Visibility is validated in core. Here we keep
    // TRS write coverage and rely on end-to-end guides for hide/show semantics.
});
