/** @jest-environment jsdom */
import { World, Node } from '@pulse-ts/core';
import { ThreeService } from '../domain/services/Three';
import { useMesh } from './useMesh';
import type { UseMeshResult } from './useMesh';

// ---------------------------------------------------------------------------
// Lightweight Three.js mock — extends the standard mock with geometry classes
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

    // Geometry stubs — record constructor args for assertion
    class BufferGeometry {
        _type = 'BufferGeometry';
        _args: unknown[];
        constructor(...args: unknown[]) {
            this._args = args;
        }
    }
    class BoxGeometry extends BufferGeometry {
        _type = 'BoxGeometry';
    }
    class SphereGeometry extends BufferGeometry {
        _type = 'SphereGeometry';
    }
    class CapsuleGeometry extends BufferGeometry {
        _type = 'CapsuleGeometry';
    }
    class CylinderGeometry extends BufferGeometry {
        _type = 'CylinderGeometry';
    }
    class ConeGeometry extends BufferGeometry {
        _type = 'ConeGeometry';
    }
    class IcosahedronGeometry extends BufferGeometry {
        _type = 'IcosahedronGeometry';
    }
    class OctahedronGeometry extends BufferGeometry {
        _type = 'OctahedronGeometry';
    }
    class PlaneGeometry extends BufferGeometry {
        _type = 'PlaneGeometry';
    }
    class TorusGeometry extends BufferGeometry {
        _type = 'TorusGeometry';
    }

    class MeshStandardMaterial {
        _opts: Record<string, unknown>;
        constructor(opts: Record<string, unknown> = {}) {
            this._opts = opts;
        }
    }

    class Mesh extends Object3D {
        geometry: BufferGeometry;
        material: MeshStandardMaterial;
        constructor(geometry: BufferGeometry, material: MeshStandardMaterial) {
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
        BoxGeometry,
        SphereGeometry,
        CapsuleGeometry,
        CylinderGeometry,
        ConeGeometry,
        IcosahedronGeometry,
        OctahedronGeometry,
        PlaneGeometry,
        TorusGeometry,
        MeshStandardMaterial,
        Mesh,
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

/** Helper: mounts a FC that calls useMesh and captures the result. */
function mountUseMesh(
    world: World,
    ...args: Parameters<typeof useMesh>
): { result: UseMeshResult; node: Node } {
    let result!: UseMeshResult;
    function TestFC() {
        result = useMesh(...args);
    }
    const node = world.mount(TestFC);
    return { result, node };
}

describe('useMesh', () => {
    let world: World;
    let svc: ThreeService;

    beforeEach(() => {
        world = new World();
        svc = world.provideService(
            new ThreeService({ canvas: createCanvas(), enableCulling: false }),
        );
    });

    // ----- Geometry creation -----

    test('creates a BoxGeometry with correct dimensions', () => {
        const { result } = mountUseMesh(world, 'box', {
            size: [2, 3, 4],
        });
        expect((result.geometry as any)._type).toBe('BoxGeometry');
        expect((result.geometry as any)._args).toEqual([2, 3, 4]);
    });

    test('creates a SphereGeometry', () => {
        const { result } = mountUseMesh(world, 'sphere', {
            radius: 5,
            widthSegments: 16,
            heightSegments: 8,
        });
        expect((result.geometry as any)._type).toBe('SphereGeometry');
        expect((result.geometry as any)._args).toEqual([5, 16, 8]);
    });

    test('creates a CapsuleGeometry', () => {
        const { result } = mountUseMesh(world, 'capsule', {
            radius: 0.3,
            length: 0.8,
            capSegments: 4,
            radialSegments: 16,
        });
        expect((result.geometry as any)._type).toBe('CapsuleGeometry');
        expect((result.geometry as any)._args).toEqual([0.3, 0.8, 4, 16]);
    });

    test('creates a CylinderGeometry with shared radius', () => {
        const { result } = mountUseMesh(world, 'cylinder', {
            radius: 0.5,
            height: 2,
            radialSegments: 8,
        });
        expect((result.geometry as any)._type).toBe('CylinderGeometry');
        expect((result.geometry as any)._args).toEqual([0.5, 0.5, 2, 8]);
    });

    test('creates a CylinderGeometry with separate radiusTop/radiusBottom', () => {
        const { result } = mountUseMesh(world, 'cylinder', {
            radiusTop: 0.2,
            radiusBottom: 0.8,
            height: 3,
        });
        expect((result.geometry as any)._type).toBe('CylinderGeometry');
        expect((result.geometry as any)._args).toEqual([
            0.2,
            0.8,
            3,
            undefined,
        ]);
    });

    test('creates a ConeGeometry', () => {
        const { result } = mountUseMesh(world, 'cone', {
            radius: 1,
            height: 2,
        });
        expect((result.geometry as any)._type).toBe('ConeGeometry');
        expect((result.geometry as any)._args).toEqual([1, 2, undefined]);
    });

    test('creates an IcosahedronGeometry', () => {
        const { result } = mountUseMesh(world, 'icosahedron', {
            radius: 0.25,
            detail: 0,
        });
        expect((result.geometry as any)._type).toBe('IcosahedronGeometry');
        expect((result.geometry as any)._args).toEqual([0.25, 0]);
    });

    test('creates an OctahedronGeometry', () => {
        const { result } = mountUseMesh(world, 'octahedron', {
            radius: 0.6,
            detail: 1,
        });
        expect((result.geometry as any)._type).toBe('OctahedronGeometry');
        expect((result.geometry as any)._args).toEqual([0.6, 1]);
    });

    test('creates a PlaneGeometry', () => {
        const { result } = mountUseMesh(world, 'plane', {
            width: 10,
            height: 5,
        });
        expect((result.geometry as any)._type).toBe('PlaneGeometry');
        expect((result.geometry as any)._args).toEqual([10, 5]);
    });

    test('creates a TorusGeometry', () => {
        const { result } = mountUseMesh(world, 'torus', {
            radius: 2,
            tube: 0.5,
        });
        expect((result.geometry as any)._type).toBe('TorusGeometry');
        expect((result.geometry as any)._args).toEqual([2, 0.5]);
    });

    // ----- Material options -----

    test('forwards material options to MeshStandardMaterial', () => {
        const { result } = mountUseMesh(world, 'box', {
            size: [1, 1, 1],
            color: 0xff0000,
            roughness: 0.4,
            metalness: 0.6,
            emissive: 0x00ff00,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8,
        });
        const opts = (result.material as any)._opts;
        expect(opts.color).toBe(0xff0000);
        expect(opts.roughness).toBe(0.4);
        expect(opts.metalness).toBe(0.6);
        expect(opts.emissive).toBe(0x00ff00);
        expect(opts.emissiveIntensity).toBe(0.5);
        expect(opts.transparent).toBe(true);
        expect(opts.opacity).toBe(0.8);
    });

    // ----- Shadow options -----

    test('applies castShadow and receiveShadow', () => {
        const { result } = mountUseMesh(world, 'box', {
            size: [1, 1, 1],
            castShadow: true,
            receiveShadow: true,
        });
        expect(result.mesh.castShadow).toBe(true);
        expect(result.mesh.receiveShadow).toBe(true);
    });

    test('shadows default to false', () => {
        const { result } = mountUseMesh(world, 'box', {
            size: [1, 1, 1],
        });
        expect(result.mesh.castShadow).toBe(false);
        expect(result.mesh.receiveShadow).toBe(false);
    });

    // ----- Integration with useThreeRoot / useObject3D -----

    test('returns a root parented to the scene', () => {
        const { result } = mountUseMesh(world, 'box', {
            size: [1, 1, 1],
        });
        expect(result.root.parent).toBe(svc.scene);
    });

    test('mesh is a child of the root', () => {
        const { result } = mountUseMesh(world, 'box', {
            size: [1, 1, 1],
        });
        expect(result.root.children).toContain(result.mesh);
    });

    test('destroying the node removes the root from the scene', () => {
        const { result, node } = mountUseMesh(world, 'box', {
            size: [1, 1, 1],
        });
        expect(svc.scene.children).toContain(result.root);

        node.destroy();

        expect(svc.scene.children).not.toContain(result.root);
    });
});
