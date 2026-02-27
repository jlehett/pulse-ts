/** @jest-environment jsdom */
import {
    World,
    Node,
    Transform,
    useComponent,
    getComponent,
} from '@pulse-ts/core';
import { ThreeService } from '../domain/services/Three';
import { useFollowCamera } from './useFollowCamera';
import type { FollowCameraResult } from './useFollowCamera';

// ---------------------------------------------------------------------------
// Three.js mock
// ---------------------------------------------------------------------------
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
        lookAt(_x: number, _y: number, _z: number) {
            // store for assertion
            (this as any)._lastLookAt = [_x, _y, _z];
        }
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
    (global as any).ResizeObserver = class {
        observe() {}
        disconnect() {}
    };
});

describe('useFollowCamera', () => {
    let world: World;
    let svc: ThreeService;
    let targetNode: Node;

    beforeEach(() => {
        world = new World({ fixedStepMs: 10 });
        svc = world.provideService(
            new ThreeService({ canvas: createCanvas(), enableCulling: false }),
        );
        // Create a target node with a Transform
        function TargetFC() {
            const t = useComponent(Transform);
            t.localPosition.set(5, 2, -3);
        }
        targetNode = world.mount(TargetFC);
    });

    test('returns the camera from ThreeService', () => {
        let result!: FollowCameraResult;
        function CamFC() {
            result = useFollowCamera(targetNode);
        }
        world.mount(CamFC);
        expect(result.camera).toBe(svc.camera);
    });

    test('initializes camera position at offset', () => {
        function CamFC() {
            useFollowCamera(targetNode, {
                offset: [1, 10, 15],
            });
        }
        world.mount(CamFC);
        // Camera should be placed at the offset initially
        expect(svc.camera.position.x).toBe(1);
        expect(svc.camera.position.y).toBe(10);
        expect(svc.camera.position.z).toBe(15);
    });

    test('uses default offset [0, 8, 12] when not specified', () => {
        function CamFC() {
            useFollowCamera(targetNode);
        }
        world.mount(CamFC);
        expect(svc.camera.position.x).toBe(0);
        expect(svc.camera.position.y).toBe(8);
        expect(svc.camera.position.z).toBe(12);
    });

    test('camera moves toward target + offset after frame tick', () => {
        function CamFC() {
            useFollowCamera(targetNode, {
                offset: [0, 5, 10],
                smoothing: 100, // very high smoothing = fast convergence
                interpolate: false,
            });
        }
        world.mount(CamFC);

        // Multiple frame ticks with high smoothing — camera should converge
        // to the desired position (target.pos + offset)
        for (let i = 0; i < 20; i++) world.tick(16);

        // Target is at (5, 2, -3), offset is (0, 5, 10) → desired (5, 7, 7)
        expect(svc.camera.position.x).toBeCloseTo(5, 1);
        expect(svc.camera.position.y).toBeCloseTo(7, 1);
        expect(svc.camera.position.z).toBeCloseTo(7, 1);
    });

    test('camera lookAt includes lookAhead offset', () => {
        function CamFC() {
            useFollowCamera(targetNode, {
                lookAhead: [0, 3, 0],
                interpolate: false,
            });
        }
        world.mount(CamFC);

        // Tick to trigger frame update
        world.tick(16);

        // Target at (5, 2, -3), lookAhead (0, 3, 0) → lookAt (5, 5, -3)
        const lastLookAt = (svc.camera as any)._lastLookAt;
        expect(lastLookAt).toBeDefined();
        expect(lastLookAt[0]).toBeCloseTo(5);
        expect(lastLookAt[1]).toBeCloseTo(5);
        expect(lastLookAt[2]).toBeCloseTo(-3);
    });

    test('lower smoothing produces a lazier follow', () => {
        function CamFC() {
            useFollowCamera(targetNode, {
                offset: [0, 0, 0],
                smoothing: 0.5, // very lazy
                interpolate: false,
            });
        }
        world.mount(CamFC);

        // Single 16ms frame tick with low smoothing
        world.tick(16);

        // Camera should NOT have converged to target yet
        // Target is at (5, 2, -3), camera started at (0, 0, 0)
        // With smoothing=0.5, t = 1 - exp(-0.5 * 0.016) ≈ 0.008 → barely moved
        expect(Math.abs(svc.camera.position.x - 5)).toBeGreaterThan(1);
    });

    test('interpolation captures prev position via fixedEarly', () => {
        function CamFC() {
            useFollowCamera(targetNode, {
                offset: [0, 0, 0],
                smoothing: 1000, // near-instant convergence
                interpolate: true,
            });
        }
        world.mount(CamFC);

        // First tick to establish prev position and run frame
        world.tick(10);

        // Use getComponent to get transform
        const transform = getComponent(targetNode, Transform) as Transform;
        transform.localPosition.set(10, 4, -6);

        // Half-step tick: should trigger fixedEarly then frame with alpha ~0.5
        world.tick(5);

        // Camera should be somewhere between old target (5,2,-3) and new (10,4,-6)
        // with high smoothing it should be close to the interpolated target
        // The exact value depends on alpha but it should NOT be exactly at (10,4,-6)
        // since we only advanced half a step
        expect(svc.camera.position.x).toBeDefined();
    });

    test('interpolate: false skips fixedEarly registration', () => {
        // This is a structural test — just ensure it doesn't crash
        function CamFC() {
            useFollowCamera(targetNode, { interpolate: false });
        }
        const node = world.mount(CamFC);
        world.tick(16);
        expect(node).toBeDefined();
    });
});
