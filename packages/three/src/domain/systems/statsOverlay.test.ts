/** @jest-environment jsdom */
import { World, StatsService } from '@pulse-ts/core';
import { ThreeService } from '../services/Three';
import { StatsOverlaySystem } from './statsOverlay';

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

function createCanvasWithContainer() {
    const container = document.createElement('div');
    // Ensure container is statically positioned so the system sets it to relative
    (container as HTMLElement).style.position = 'static';
    document.body.appendChild(container);
    const canvas = document.createElement('canvas');
    Object.defineProperty(canvas, 'clientWidth', { value: 320 });
    Object.defineProperty(canvas, 'clientHeight', { value: 200 });
    container.appendChild(canvas);
    return { container, canvas: canvas as HTMLCanvasElement };
}

test('StatsOverlaySystem mounts overlay and updates text', () => {
    const world = new World();
    const { container, canvas } = createCanvasWithContainer();
    world.provideService(new ThreeService({ canvas }));
    world.provideService(new StatsService());

    const sys = world.addSystem(new StatsOverlaySystem({ updateMs: 50 }));

    // Expect overlay div appended under container
    // One child is the canvas, another should be the overlay
    expect(container.children.length).toBe(2);
    const overlay = container.children[1] as HTMLDivElement;

    // Advance enough time to trigger update
    (sys as any).update(0.06); // 60ms > 50ms
    expect(overlay.textContent || '').toContain('fps');
    expect(overlay.textContent || '').toContain('fixed');

    // Detach removes element
    sys.detach();
    expect(container.contains(overlay)).toBe(false);
});
