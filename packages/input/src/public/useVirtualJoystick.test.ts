import { World, mount } from '@pulse-ts/core';
import { installInput } from './install';
import type { VirtualJoystickHandle } from './useVirtualJoystick';
import { useVirtualJoystick } from './useVirtualJoystick';
import { InputService } from '../domain/services/Input';

// Minimal Touch/TouchEvent mocks for jsdom
function createTouch(
    target: EventTarget,
    id: number,
    clientX: number,
    clientY: number,
): Touch {
    return {
        identifier: id,
        target,
        clientX,
        clientY,
        screenX: clientX,
        screenY: clientY,
        pageX: clientX,
        pageY: clientY,
        radiusX: 0,
        radiusY: 0,
        rotationAngle: 0,
        force: 1,
    } as Touch;
}

function createTouchList(...touches: Touch[]): TouchList {
    const list = touches as unknown as TouchList;
    (list as any).length = touches.length;
    (list as any).item = (i: number) => touches[i] ?? null;
    // Allow indexed access
    for (let i = 0; i < touches.length; i++) {
        (list as any)[i] = touches[i];
    }
    return list;
}

function fireTouchEvent(el: HTMLElement, type: string, touches: Touch[]): void {
    const event = new Event(type, {
        bubbles: true,
        cancelable: true,
    }) as any;
    event.changedTouches = createTouchList(...touches);
    event.touches = createTouchList(...touches);
    event.preventDefault = jest.fn();
    el.dispatchEvent(event);
}

// Mock getBoundingClientRect for the container
function mockContainerRect(
    el: HTMLElement,
    x: number,
    y: number,
    size: number,
): void {
    jest.spyOn(el, 'getBoundingClientRect').mockReturnValue({
        left: x,
        top: y,
        right: x + size,
        bottom: y + size,
        width: size,
        height: size,
        x,
        y,
        toJSON: () => ({}),
    });
}

describe('useVirtualJoystick', () => {
    let world: World;
    let svc: InputService;

    beforeEach(() => {
        world = new World();
        svc = installInput(world, {});
    });

    afterEach(() => {
        // Clean up any appended elements
        document.body.innerHTML = '';
    });

    function mountJoystick(
        action: string,
        options: Parameters<typeof useVirtualJoystick>[1] = {},
    ): VirtualJoystickHandle {
        let handle!: VirtualJoystickHandle;
        mount(
            world,
            () => {
                handle = useVirtualJoystick(action, options);
            },
            undefined,
        );
        return handle;
    }

    test('creates a DOM element appended to document.body', () => {
        const handle = mountJoystick('move');
        expect(handle.element).toBeInstanceOf(HTMLElement);
        expect(document.body.contains(handle.element)).toBe(true);
    });

    test('appends to custom parent when specified', () => {
        const parent = document.createElement('div');
        document.body.appendChild(parent);
        const handle = mountJoystick('move', { parent });
        expect(parent.contains(handle.element)).toBe(true);
    });

    test('initial axes are zero', () => {
        const handle = mountJoystick('move');
        expect(handle.axes).toEqual({ x: 0, y: 0 });
    });

    test('setVisible hides and shows the element', () => {
        const handle = mountJoystick('move');
        handle.setVisible(false);
        expect(handle.element.style.display).toBe('none');
        handle.setVisible(true);
        expect(handle.element.style.display).toBe('');
    });

    test('destroy removes the element and releases axis', () => {
        const handle = mountJoystick('move');
        const el = handle.element;
        expect(document.body.contains(el)).toBe(true);
        handle.destroy();
        expect(document.body.contains(el)).toBe(false);
    });

    test('uses default size of 120', () => {
        const handle = mountJoystick('move');
        expect(handle.element.style.width).toBe('120px');
        expect(handle.element.style.height).toBe('120px');
    });

    test('respects custom size', () => {
        const handle = mountJoystick('move', { size: 200 });
        expect(handle.element.style.width).toBe('200px');
        expect(handle.element.style.height).toBe('200px');
    });

    test('positions bottom-left by default', () => {
        const handle = mountJoystick('move');
        expect(handle.element.style.left).toBe('20px');
        expect(handle.element.style.bottom).toBe('20px');
    });

    test('positions bottom-right when specified', () => {
        const handle = mountJoystick('move', { position: 'bottom-right' });
        expect(handle.element.style.right).toBe('20px');
        expect(handle.element.style.bottom).toBe('20px');
    });

    test('positions with custom coordinates', () => {
        const handle = mountJoystick('move', {
            position: { x: '50%', y: '80%' },
        });
        expect(handle.element.style.left).toBe('50%');
        expect(handle.element.style.top).toBe('80%');
    });

    test('touch interaction injects axis2D hold into InputService', () => {
        const handle = mountJoystick('move', { size: 120, deadzone: 0 });
        const el = handle.element;
        mockContainerRect(el, 0, 0, 120); // center at (60, 60)

        const touch = createTouch(el, 1, 120, 60); // max right
        fireTouchEvent(el, 'touchstart', [touch]);

        svc.commit();
        const vec = svc.vec2('move');
        expect(vec.x).toBeCloseTo(1);
        expect(vec.y).toBeCloseTo(0);
    });

    test('touch move updates axis values', () => {
        const handle = mountJoystick('move', { size: 120, deadzone: 0 });
        const el = handle.element;
        mockContainerRect(el, 0, 0, 120);

        const startTouch = createTouch(el, 1, 90, 60); // right of center
        fireTouchEvent(el, 'touchstart', [startTouch]);

        const moveTouch = createTouch(el, 1, 60, 120); // below center (max down)
        fireTouchEvent(el, 'touchmove', [moveTouch]);

        svc.commit();
        const vec = svc.vec2('move');
        expect(vec.x).toBeCloseTo(0);
        expect(vec.y).toBeCloseTo(1);
    });

    test('touch end releases axis hold', () => {
        const handle = mountJoystick('move', { size: 120, deadzone: 0 });
        const el = handle.element;
        mockContainerRect(el, 0, 0, 120);

        const touch = createTouch(el, 1, 120, 60);
        fireTouchEvent(el, 'touchstart', [touch]);

        svc.commit();
        expect(svc.vec2('move').x).toBeCloseTo(1);

        fireTouchEvent(el, 'touchend', [touch]);
        svc.commit();
        // After release, the hold is cleared so the default zero is returned
        expect(svc.vec2('move')).toEqual({ x: 0, y: 0 });
    });

    test('touch cancel releases axis hold', () => {
        const handle = mountJoystick('move', { size: 120, deadzone: 0 });
        const el = handle.element;
        mockContainerRect(el, 0, 0, 120);

        const touch = createTouch(el, 1, 120, 60);
        fireTouchEvent(el, 'touchstart', [touch]);
        svc.commit();
        expect(svc.vec2('move').x).toBeCloseTo(1);

        fireTouchEvent(el, 'touchcancel', [touch]);
        svc.commit();
        expect(svc.vec2('move')).toEqual({ x: 0, y: 0 });
    });

    test('deadzone suppresses small movements', () => {
        const handle = mountJoystick('move', {
            size: 120,
            deadzone: 0.5, // Large deadzone: 50% of radius
        });
        const el = handle.element;
        mockContainerRect(el, 0, 0, 120);

        // Touch 15px right of center — within deadzone (30px)
        const touch = createTouch(el, 1, 75, 60);
        fireTouchEvent(el, 'touchstart', [touch]);

        expect(handle.axes.x).toBe(0);
        expect(handle.axes.y).toBe(0);
    });

    test('ignores second simultaneous touch', () => {
        const handle = mountJoystick('move', { size: 120, deadzone: 0 });
        const el = handle.element;
        mockContainerRect(el, 0, 0, 120);

        const touch1 = createTouch(el, 1, 120, 60);
        fireTouchEvent(el, 'touchstart', [touch1]);
        expect(handle.axes.x).toBeCloseTo(1);

        // Second touch should be ignored
        const touch2 = createTouch(el, 2, 0, 60);
        fireTouchEvent(el, 'touchstart', [touch2]);
        // Axes should still reflect first touch
        expect(handle.axes.x).toBeCloseTo(1);
    });

    test('clamps displacement to max radius for visuals but normalizes axis to 1', () => {
        const handle = mountJoystick('move', { size: 120, deadzone: 0 });
        const el = handle.element;
        mockContainerRect(el, 0, 0, 120);

        // Touch way beyond max radius
        const touch = createTouch(el, 1, 500, 60);
        fireTouchEvent(el, 'touchstart', [touch]);

        // Axis should be clamped to 1
        expect(handle.axes.x).toBeCloseTo(1);
        expect(handle.axes.y).toBeCloseTo(0);
    });

    test('custom render callback receives render state', () => {
        const renderFn = jest.fn((state: any) => {
            const el = document.createElement('div');
            el.className = 'custom-joystick';
            // Verify state has reactive getters
            expect(typeof state.knobX).toBe('function');
            expect(typeof state.knobY).toBe('function');
            expect(typeof state.axisX).toBe('function');
            expect(typeof state.axisY).toBe('function');
            expect(typeof state.active).toBe('function');
            expect(state.size).toBe(120);
            return el;
        });

        mountJoystick('move', { render: renderFn });
        expect(renderFn).toHaveBeenCalledTimes(1);
    });

    test('render state getters update on touch', () => {
        let capturedState: any;
        const renderFn = (state: any) => {
            capturedState = state;
            return document.createElement('div');
        };

        const handle = mountJoystick('move', {
            size: 120,
            deadzone: 0,
            render: renderFn,
        });
        const el = handle.element;
        mockContainerRect(el, 0, 0, 120);

        expect(capturedState.active()).toBe(false);
        expect(capturedState.knobX()).toBe(0);

        const touch = createTouch(el, 1, 120, 60);
        fireTouchEvent(el, 'touchstart', [touch]);

        expect(capturedState.active()).toBe(true);
        expect(capturedState.knobX()).toBeGreaterThan(0);
        expect(capturedState.axisX()).toBeCloseTo(1);
    });

    test('throws if InputService is not installed', () => {
        const bareWorld = new World();
        expect(() => {
            mount(
                bareWorld,
                () => {
                    useVirtualJoystick('move');
                },
                undefined,
            );
        }).toThrow('InputService not provided');
    });
});
