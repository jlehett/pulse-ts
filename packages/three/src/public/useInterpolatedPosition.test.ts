/** @jest-environment jsdom */
import { World, Transform, useComponent } from '@pulse-ts/core';
import { ThreeService } from '../domain/services/Three';
import { useInterpolatedPosition } from './useInterpolatedPosition';
import { useThreeRoot } from './hooks';

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useInterpolatedPosition', () => {
    let world: World;

    beforeEach(() => {
        world = new World({ fixedStepMs: 10 });
        world.provideService(
            new ThreeService({ canvas: createCanvas(), enableCulling: false }),
        );
    });

    test('sets target position to source position on first frame', () => {
        let root: any;
        function TestFC() {
            const t = useComponent(Transform);
            t.localPosition.set(3, 5, 7);
            root = useThreeRoot();
            useInterpolatedPosition(t, root);
        }
        world.mount(TestFC);

        // Tick to trigger frame update
        world.tick(10);

        expect(root.position.x).toBeCloseTo(3);
        expect(root.position.y).toBeCloseTo(5);
        expect(root.position.z).toBeCloseTo(7);
    });

    test('interpolates between previous and current position', () => {
        let transform!: Transform;
        let root: any;
        function TestFC() {
            transform = useComponent(Transform);
            transform.localPosition.set(0, 0, 0);
            root = useThreeRoot();
            useInterpolatedPosition(transform, root);
        }
        world.mount(TestFC);

        // First tick establishes the previous position and runs frame
        world.tick(10);

        // Move to new position
        transform.localPosition.set(10, 20, 30);

        // Tick half a fixed step — alpha should be ~0.5
        world.tick(5);

        // Position should be between (0,0,0) and (10,20,30)
        // Not exactly at either extreme
        expect(root.position.x).toBeGreaterThan(0);
        expect(root.position.x).toBeLessThan(10);
        expect(root.position.y).toBeGreaterThan(0);
        expect(root.position.y).toBeLessThan(20);
    });

    test('converges to source position after full step', () => {
        let transform!: Transform;
        let root: any;
        function TestFC() {
            transform = useComponent(Transform);
            transform.localPosition.set(4, 8, 12);
            root = useThreeRoot();
            useInterpolatedPosition(transform, root);
        }
        world.mount(TestFC);

        // Run a full fixed step — alpha should reach 1
        world.tick(10);
        world.tick(10);

        expect(root.position.x).toBeCloseTo(4, 1);
        expect(root.position.y).toBeCloseTo(8, 1);
        expect(root.position.z).toBeCloseTo(12, 1);
    });

    test('snap callback bypasses interpolation', () => {
        let transform!: Transform;
        let root: any;
        let shouldSnap = false;
        function TestFC() {
            transform = useComponent(Transform);
            transform.localPosition.set(0, 0, 0);
            root = useThreeRoot();
            useInterpolatedPosition(transform, root, {
                snap: () => {
                    if (shouldSnap) {
                        shouldSnap = false;
                        return true;
                    }
                    return false;
                },
            });
        }
        world.mount(TestFC);

        // Establish position
        world.tick(10);

        // Teleport: move to (100, 200, 300) and enable snap
        transform.localPosition.set(100, 200, 300);
        shouldSnap = true;

        // Even a partial tick should snap directly (no interpolation)
        world.tick(1);

        expect(root.position.x).toBe(100);
        expect(root.position.y).toBe(200);
        expect(root.position.z).toBe(300);
    });

    test('snap resets previous position to avoid lerp artifacts', () => {
        let transform!: Transform;
        let root: any;
        let shouldSnap = false;
        function TestFC() {
            transform = useComponent(Transform);
            transform.localPosition.set(0, 0, 0);
            root = useThreeRoot();
            useInterpolatedPosition(transform, root, {
                snap: () => {
                    if (shouldSnap) {
                        shouldSnap = false;
                        return true;
                    }
                    return false;
                },
            });
        }
        world.mount(TestFC);

        world.tick(10);

        // Snap to new position
        transform.localPosition.set(50, 50, 50);
        shouldSnap = true;
        world.tick(1);

        // Next frame without snap — should stay at (50,50,50) since
        // prev was reset to current during snap
        world.tick(5);
        expect(root.position.x).toBeCloseTo(50, 1);
        expect(root.position.y).toBeCloseTo(50, 1);
        expect(root.position.z).toBeCloseTo(50, 1);
    });

    test('custom getAlpha overrides world alpha', () => {
        let transform!: Transform;
        let root: any;
        function TestFC() {
            transform = useComponent(Transform);
            transform.localPosition.set(0, 0, 0);
            root = useThreeRoot();
            useInterpolatedPosition(transform, root, {
                getAlpha: () => 0.5, // Always half-interpolated
            });
        }
        world.mount(TestFC);

        // Establish prev position at (0,0,0) — full fixed step
        world.tick(10);

        // Move to (10, 0, 0)
        transform.localPosition.set(10, 0, 0);

        // Tick less than fixedStepMs so no new fixed step runs —
        // prev stays at (0,0,0), current is (10,0,0), alpha is 0.5
        world.tick(1);

        expect(root.position.x).toBeCloseTo(5);
        expect(root.position.y).toBeCloseTo(0);
        expect(root.position.z).toBeCloseTo(0);
    });

    test('initializes previous position from source', () => {
        let root: any;
        function TestFC() {
            const t = useComponent(Transform);
            t.localPosition.set(7, 8, 9);
            root = useThreeRoot();
            useInterpolatedPosition(t, root);
        }
        world.mount(TestFC);

        // First partial tick — should not cause a jump from (0,0,0)
        world.tick(5);

        // Should be at or near (7,8,9) since prev was initialized from source
        expect(root.position.x).toBeCloseTo(7, 0);
        expect(root.position.y).toBeCloseTo(8, 0);
        expect(root.position.z).toBeCloseTo(9, 0);
    });
});
