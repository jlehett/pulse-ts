/** @jest-environment jsdom */
import { World } from '@pulse-ts/core';
import { ThreeService } from '../domain/services/Three';
import { useAmbientLight, useDirectionalLight, useFog } from './useLighting';
import type * as THREE from 'three';

// ---------------------------------------------------------------------------
// Three.js mock — includes light and fog stubs
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
    class Vector2 {
        x = 0;
        y = 0;
        set(x: number, y: number) {
            this.x = x;
            this.y = y;
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
    class Scene extends Object3D {
        fog: any = null;
    }
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

    // Light stubs
    class Light extends Object3D {
        _color: number | undefined;
        _intensity: number | undefined;
        castShadow = false;
        constructor(color?: number, intensity?: number) {
            super();
            this._color = color;
            this._intensity = intensity;
        }
    }
    class AmbientLight extends Light {
        _type = 'AmbientLight';
    }
    class DirectionalLight extends Light {
        _type = 'DirectionalLight';
        shadow = {
            mapSize: new Vector2(),
            camera: {
                near: 0.5,
                far: 500,
                left: -5,
                right: 5,
                top: 5,
                bottom: -5,
            },
        };
    }

    // Fog stub
    class Fog {
        _color: number;
        _near: number | undefined;
        _far: number | undefined;
        constructor(color: number, near?: number, far?: number) {
            this._color = color;
            this._near = near;
            this._far = far;
        }
    }

    return {
        Vector3,
        Vector2,
        Quaternion,
        Object3D,
        Group,
        Scene,
        Matrix4,
        PerspectiveCamera,
        Color,
        WebGLRenderer,
        Light,
        AmbientLight,
        DirectionalLight,
        Fog,
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

describe('useAmbientLight', () => {
    let world: World;
    let svc: ThreeService;

    beforeEach(() => {
        world = new World();
        svc = world.provideService(
            new ThreeService({ canvas: createCanvas(), enableCulling: false }),
        );
    });

    test('adds an ambient light to the scene', () => {
        let light!: THREE.AmbientLight;
        function FC() {
            light = useAmbientLight({ color: 0xaabbcc, intensity: 0.5 });
        }
        world.mount(FC);
        expect(svc.scene.children).toContain(light);
        expect((light as any)._type).toBe('AmbientLight');
        expect((light as any)._color).toBe(0xaabbcc);
        expect((light as any)._intensity).toBe(0.5);
    });

    test('removes the light on node destroy', () => {
        let light!: THREE.AmbientLight;
        function FC() {
            light = useAmbientLight();
        }
        const node = world.mount(FC);
        expect(svc.scene.children).toContain(light);

        node.destroy();
        expect(svc.scene.children).not.toContain(light);
    });
});

describe('useDirectionalLight', () => {
    let world: World;
    let svc: ThreeService;

    beforeEach(() => {
        world = new World();
        svc = world.provideService(
            new ThreeService({ canvas: createCanvas(), enableCulling: false }),
        );
    });

    test('adds a directional light to the scene', () => {
        let light!: THREE.DirectionalLight;
        function FC() {
            light = useDirectionalLight({
                color: 0xffffff,
                intensity: 1.0,
                position: [10, 20, 30],
            });
        }
        world.mount(FC);
        expect(svc.scene.children).toContain(light);
        expect((light as any)._type).toBe('DirectionalLight');
        expect(light.position.x).toBe(10);
        expect(light.position.y).toBe(20);
        expect(light.position.z).toBe(30);
    });

    test('configures shadow when castShadow is true', () => {
        let light!: THREE.DirectionalLight;
        function FC() {
            light = useDirectionalLight({
                castShadow: true,
                shadowMapSize: 2048,
                shadowBounds: {
                    near: 0.5,
                    far: 100,
                    left: -10,
                    right: 72,
                    top: 15,
                    bottom: -12,
                },
            });
        }
        world.mount(FC);
        expect(light.castShadow).toBe(true);
        expect(light.shadow.mapSize.x).toBe(2048);
        expect(light.shadow.mapSize.y).toBe(2048);
        expect(light.shadow.camera.near).toBe(0.5);
        expect(light.shadow.camera.far).toBe(100);
        expect(light.shadow.camera.left).toBe(-10);
        expect(light.shadow.camera.right).toBe(72);
        expect(light.shadow.camera.top).toBe(15);
        expect(light.shadow.camera.bottom).toBe(-12);
    });

    test('castShadow defaults to false', () => {
        let light!: THREE.DirectionalLight;
        function FC() {
            light = useDirectionalLight();
        }
        world.mount(FC);
        expect(light.castShadow).toBe(false);
    });

    test('removes the light on node destroy', () => {
        let light!: THREE.DirectionalLight;
        function FC() {
            light = useDirectionalLight();
        }
        const node = world.mount(FC);
        expect(svc.scene.children).toContain(light);

        node.destroy();
        expect(svc.scene.children).not.toContain(light);
    });
});

describe('useFog', () => {
    let world: World;
    let svc: ThreeService;

    beforeEach(() => {
        world = new World();
        svc = world.provideService(
            new ThreeService({ canvas: createCanvas(), enableCulling: false }),
        );
    });

    test('sets scene fog', () => {
        let fog!: THREE.Fog;
        function FC() {
            fog = useFog({ color: 0x0a0a1a, near: 40, far: 100 });
        }
        world.mount(FC);
        expect(svc.scene.fog).toBe(fog);
        expect((fog as any)._color).toBe(0x0a0a1a);
        expect((fog as any)._near).toBe(40);
        expect((fog as any)._far).toBe(100);
    });

    test('clears scene fog on node destroy', () => {
        function FC() {
            useFog({ color: 0x000000, near: 1, far: 100 });
        }
        const node = world.mount(FC);
        expect(svc.scene.fog).not.toBeNull();

        node.destroy();
        expect(svc.scene.fog).toBeNull();
    });

    test('does not clear fog if scene fog was replaced by another', () => {
        let fog1!: THREE.Fog;
        function FC1() {
            fog1 = useFog({ color: 0x111111 });
        }
        const node1 = world.mount(FC1);

        // Simulate another fog replacing it
        const otherFog = { _color: 0x222222 };
        (svc.scene as any).fog = otherFog;

        node1.destroy();
        // Should NOT clear since it's not our fog anymore
        expect(svc.scene.fog).toBe(otherFog);
    });
});
