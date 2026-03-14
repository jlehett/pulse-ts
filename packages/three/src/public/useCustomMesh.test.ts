/** @jest-environment jsdom */
import { World, Node } from '@pulse-ts/core';
import { ThreeService } from '../domain/services/Three';
import { useCustomMesh } from './useCustomMesh';
import type { CustomMeshResult } from './useCustomMesh';

// ---------------------------------------------------------------------------
// Three.js mock — matches useMesh.test.ts pattern, adds Points/Line/LineSegments
// ---------------------------------------------------------------------------
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

    class BufferGeometry {
        _type = 'BufferGeometry';
        dispose = jest.fn();
    }

    class Material {
        _type = 'Material';
        dispose = jest.fn();
    }

    class Mesh extends Object3D {
        _objectType = 'Mesh';
        geometry: BufferGeometry;
        material: Material;
        constructor(geometry: BufferGeometry, material: Material) {
            super();
            this.geometry = geometry;
            this.material = material;
        }
    }

    class Points extends Object3D {
        _objectType = 'Points';
        geometry: BufferGeometry;
        material: Material;
        constructor(geometry: BufferGeometry, material: Material) {
            super();
            this.geometry = geometry;
            this.material = material;
        }
    }

    class Line extends Object3D {
        _objectType = 'Line';
        geometry: BufferGeometry;
        material: Material;
        constructor(geometry: BufferGeometry, material: Material) {
            super();
            this.geometry = geometry;
            this.material = material;
        }
    }

    class LineSegments extends Object3D {
        _objectType = 'LineSegments';
        geometry: BufferGeometry;
        material: Material;
        constructor(geometry: BufferGeometry, material: Material) {
            super();
            this.geometry = geometry;
            this.material = material;
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
        BufferGeometry,
        Material,
        Mesh,
        Points,
        Line,
        LineSegments,
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

/** Helper: mounts a FC that calls useCustomMesh and captures the result. */
function mountUseCustomMesh(
    world: World,
    ...args: Parameters<typeof useCustomMesh>
): { result: CustomMeshResult; node: Node } {
    let result!: CustomMeshResult;
    function TestFC() {
        result = useCustomMesh(...args);
    }
    const node = world.mount(TestFC);
    return { result, node };
}

describe('useCustomMesh', () => {
    let world: World;
    let svc: ThreeService;

    beforeEach(() => {
        world = new World();
        svc = world.provideService(
            new ThreeService({ canvas: createCanvas(), enableCulling: false }),
        );
    });

    // ----- Object creation -----

    test('creates a Mesh by default', () => {
        const { result } = mountUseCustomMesh(world, {
            geometry: () => new (jest.requireMock('three').BufferGeometry)(),
            material: () => new (jest.requireMock('three').Material)(),
        });
        expect((result.object as any)._objectType).toBe('Mesh');
    });

    test('creates a Mesh when type is "mesh"', () => {
        const { result } = mountUseCustomMesh(world, {
            geometry: () => new (jest.requireMock('three').BufferGeometry)(),
            material: () => new (jest.requireMock('three').Material)(),
            type: 'mesh',
        });
        expect((result.object as any)._objectType).toBe('Mesh');
    });

    test('creates Points when type is "points"', () => {
        const { result } = mountUseCustomMesh(world, {
            geometry: () => new (jest.requireMock('three').BufferGeometry)(),
            material: () => new (jest.requireMock('three').Material)(),
            type: 'points',
        });
        expect((result.object as any)._objectType).toBe('Points');
    });

    test('creates a Line when type is "line"', () => {
        const { result } = mountUseCustomMesh(world, {
            geometry: () => new (jest.requireMock('three').BufferGeometry)(),
            material: () => new (jest.requireMock('three').Material)(),
            type: 'line',
        });
        expect((result.object as any)._objectType).toBe('Line');
    });

    test('creates LineSegments when type is "lineSegments"', () => {
        const { result } = mountUseCustomMesh(world, {
            geometry: () => new (jest.requireMock('three').BufferGeometry)(),
            material: () => new (jest.requireMock('three').Material)(),
            type: 'lineSegments',
        });
        expect((result.object as any)._objectType).toBe('LineSegments');
    });

    // ----- Factory invocation -----

    test('invokes geometry and material factory functions', () => {
        const geoFactory = jest.fn(
            () => new (jest.requireMock('three').BufferGeometry)(),
        );
        const matFactory = jest.fn(
            () => new (jest.requireMock('three').Material)(),
        );

        mountUseCustomMesh(world, {
            geometry: geoFactory,
            material: matFactory,
        });

        expect(geoFactory).toHaveBeenCalledTimes(1);
        expect(matFactory).toHaveBeenCalledTimes(1);
    });

    // ----- Return values -----

    test('returns root, object, material, and geometry', () => {
        const { result } = mountUseCustomMesh(world, {
            geometry: () => new (jest.requireMock('three').BufferGeometry)(),
            material: () => new (jest.requireMock('three').Material)(),
        });
        expect(result.root).toBeDefined();
        expect(result.object).toBeDefined();
        expect(result.material).toBeDefined();
        expect(result.geometry).toBeDefined();
    });

    // ----- Shadow options -----

    test('applies castShadow and receiveShadow for mesh type', () => {
        const { result } = mountUseCustomMesh(world, {
            geometry: () => new (jest.requireMock('three').BufferGeometry)(),
            material: () => new (jest.requireMock('three').Material)(),
            type: 'mesh',
            castShadow: true,
            receiveShadow: true,
        });
        expect(result.object.castShadow).toBe(true);
        expect(result.object.receiveShadow).toBe(true);
    });

    test('shadow options default to false for mesh type', () => {
        const { result } = mountUseCustomMesh(world, {
            geometry: () => new (jest.requireMock('three').BufferGeometry)(),
            material: () => new (jest.requireMock('three').Material)(),
            type: 'mesh',
        });
        expect(result.object.castShadow).toBe(false);
        expect(result.object.receiveShadow).toBe(false);
    });

    test('shadow options are ignored for points type', () => {
        const { result } = mountUseCustomMesh(world, {
            geometry: () => new (jest.requireMock('three').BufferGeometry)(),
            material: () => new (jest.requireMock('three').Material)(),
            type: 'points',
            castShadow: true,
            receiveShadow: true,
        });
        // Points inherit Object3D defaults (false)
        expect(result.object.castShadow).toBe(false);
        expect(result.object.receiveShadow).toBe(false);
    });

    test('shadow options are ignored for line type', () => {
        const { result } = mountUseCustomMesh(world, {
            geometry: () => new (jest.requireMock('three').BufferGeometry)(),
            material: () => new (jest.requireMock('three').Material)(),
            type: 'line',
            castShadow: true,
            receiveShadow: true,
        });
        expect(result.object.castShadow).toBe(false);
        expect(result.object.receiveShadow).toBe(false);
    });

    // ----- Scene graph integration -----

    test('returns a root parented to the scene', () => {
        const { result } = mountUseCustomMesh(world, {
            geometry: () => new (jest.requireMock('three').BufferGeometry)(),
            material: () => new (jest.requireMock('three').Material)(),
        });
        expect(result.root.parent).toBe(svc.scene);
    });

    test('object is a child of the root', () => {
        const { result } = mountUseCustomMesh(world, {
            geometry: () => new (jest.requireMock('three').BufferGeometry)(),
            material: () => new (jest.requireMock('three').Material)(),
        });
        expect(result.root.children).toContain(result.object);
    });

    // ----- Disposal -----

    test('destroying the node removes the root from the scene', () => {
        const { result, node } = mountUseCustomMesh(world, {
            geometry: () => new (jest.requireMock('three').BufferGeometry)(),
            material: () => new (jest.requireMock('three').Material)(),
        });
        expect(svc.scene.children).toContain(result.root);

        node.destroy();

        expect(svc.scene.children).not.toContain(result.root);
    });

    test('destroying the node disposes geometry and material', () => {
        const { result, node } = mountUseCustomMesh(world, {
            geometry: () => new (jest.requireMock('three').BufferGeometry)(),
            material: () => new (jest.requireMock('three').Material)(),
        });

        node.destroy();

        expect(result.geometry.dispose).toHaveBeenCalledTimes(1);
        expect(result.material.dispose).toHaveBeenCalledTimes(1);
    });
});
