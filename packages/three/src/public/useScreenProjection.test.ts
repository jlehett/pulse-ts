/** @jest-environment jsdom */
import { World } from '@pulse-ts/core';
import { ThreeService } from '../domain/services/Three';
import { useScreenProjection } from './useScreenProjection';
import type { ScreenPoint, WorldPoint } from './useScreenProjection';

// ---------------------------------------------------------------------------
// Lightweight Three.js mock
// ---------------------------------------------------------------------------

let mockProject: jest.Mock;

jest.mock('three', () => {
    class Vector3 {
        x = 0;
        y = 0;
        z = 0;
        set(x: number, y: number, z: number) {
            this.x = x;
            this.y = y;
            this.z = z;
            return this;
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
        project(camera: any) {
            if (mockProject) {
                const result = mockProject(this.x, this.y, this.z, camera);
                this.x = result.x;
                this.y = result.y;
                this.z = result.z;
            }
            return this;
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
        castShadow = false;
        receiveShadow = false;
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

function createCanvas(width = 800, height = 600) {
    const canvas = document.createElement('canvas');
    Object.defineProperty(canvas, 'clientWidth', { value: width });
    Object.defineProperty(canvas, 'clientHeight', { value: height });
    return canvas as HTMLCanvasElement;
}

beforeAll(() => {
    (global as any).ResizeObserver = class {
        observe() {}
        disconnect() {}
    };
});

function mountProjection(world: World): (position: WorldPoint) => ScreenPoint {
    let project!: (position: WorldPoint) => ScreenPoint;
    function TestFC() {
        project = useScreenProjection();
    }
    world.mount(TestFC);
    return project;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useScreenProjection', () => {
    let world: World;

    beforeEach(() => {
        world = new World();
        world.provideService(
            new ThreeService({ canvas: createCanvas(), enableCulling: false }),
        );
        // Default mock: identity projection (NDC coords returned as-is)
        mockProject = jest.fn((x, y, z) => ({ x, y, z }));
    });

    test('returns a function', () => {
        const project = mountProjection(world);
        expect(typeof project).toBe('function');
    });

    test('projects center of screen (NDC 0,0) to canvas center', () => {
        // NDC (0,0,0) → center of 800×600 canvas
        mockProject = jest.fn(() => ({ x: 0, y: 0, z: 0 }));
        const project = mountProjection(world);

        const result = project({ x: 0, y: 0, z: 0 });
        expect(result.x).toBe(400);
        expect(result.y).toBe(300);
    });

    test('projects top-left corner (NDC -1,1) to (0,0)', () => {
        mockProject = jest.fn(() => ({ x: -1, y: 1, z: 0 }));
        const project = mountProjection(world);

        const result = project({ x: 0, y: 0, z: 0 });
        expect(result.x).toBe(0);
        expect(result.y).toBe(0);
    });

    test('projects bottom-right corner (NDC 1,-1) to (800,600)', () => {
        mockProject = jest.fn(() => ({ x: 1, y: -1, z: 0 }));
        const project = mountProjection(world);

        const result = project({ x: 0, y: 0, z: 0 });
        expect(result.x).toBe(800);
        expect(result.y).toBe(600);
    });

    test('depth is normalized 0-1 from NDC z', () => {
        // NDC z=-1 (near) → depth 0
        mockProject = jest.fn(() => ({ x: 0, y: 0, z: -1 }));
        const project = mountProjection(world);

        const near = project({ x: 0, y: 0, z: 0 });
        expect(near.depth).toBe(0);

        // NDC z=1 (far) → depth 1
        mockProject = jest.fn(() => ({ x: 0, y: 0, z: 1 }));
        const far = project({ x: 0, y: 0, z: 0 });
        expect(far.depth).toBe(1);
    });

    test('visible is true when z is within [-1, 1]', () => {
        mockProject = jest.fn(() => ({ x: 0, y: 0, z: 0 }));
        const project = mountProjection(world);

        expect(project({ x: 0, y: 0, z: 0 }).visible).toBe(true);
    });

    test('visible is true at NDC z boundaries', () => {
        const project = mountProjection(world);

        mockProject = jest.fn(() => ({ x: 0, y: 0, z: -1 }));
        expect(project({ x: 0, y: 0, z: 0 }).visible).toBe(true);

        mockProject = jest.fn(() => ({ x: 0, y: 0, z: 1 }));
        expect(project({ x: 0, y: 0, z: 0 }).visible).toBe(true);
    });

    test('visible is false when behind camera (z < -1)', () => {
        mockProject = jest.fn(() => ({ x: 0, y: 0, z: -1.5 }));
        const project = mountProjection(world);

        expect(project({ x: 0, y: 0, z: 0 }).visible).toBe(false);
    });

    test('visible is false when beyond far plane (z > 1)', () => {
        mockProject = jest.fn(() => ({ x: 0, y: 0, z: 1.5 }));
        const project = mountProjection(world);

        expect(project({ x: 0, y: 0, z: 0 }).visible).toBe(false);
    });

    test('reuses the same ScreenPoint object', () => {
        mockProject = jest.fn(() => ({ x: 0, y: 0, z: 0 }));
        const project = mountProjection(world);

        const a = project({ x: 0, y: 0, z: 0 });
        const b = project({ x: 1, y: 1, z: 1 });
        expect(a).toBe(b);
    });

    test('passes world position to Vector3.set', () => {
        mockProject = jest.fn((x, y, z) => ({ x, y, z }));
        const project = mountProjection(world);

        project({ x: 5, y: 10, z: 15 });
        expect(mockProject).toHaveBeenCalledWith(5, 10, 15, expect.anything());
    });

    test('works with different canvas sizes', () => {
        const smallWorld = new World();
        smallWorld.provideService(
            new ThreeService({
                canvas: createCanvas(200, 100),
                enableCulling: false,
            }),
        );

        mockProject = jest.fn(() => ({ x: 0, y: 0, z: 0 }));
        const project = mountProjection(smallWorld);

        const result = project({ x: 0, y: 0, z: 0 });
        expect(result.x).toBe(100);
        expect(result.y).toBe(50);
    });
});
