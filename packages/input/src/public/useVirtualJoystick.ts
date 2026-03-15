import { __fcCurrent } from '@pulse-ts/core';
import { InputService } from '../domain/services/Input';
import {
    computeDisplacement,
    applyDeadzone,
    clampToRadius,
} from '../domain/services/internal/joystickMath';

/**
 * Position preset or custom CSS coordinates for the joystick.
 */
export type JoystickPosition =
    | 'bottom-left'
    | 'bottom-right'
    | { x: string; y: string };

/**
 * Reactive state passed to a custom joystick render callback.
 * All value accessors are functions (reactive getters) so they integrate
 * with reactive DOM binding systems.
 */
export interface JoystickRenderState {
    /** Knob offset in pixels from center (-maxOffset to +maxOffset). Reactive getter. */
    knobX: () => number;
    /** Knob offset in pixels from center (-maxOffset to +maxOffset). Reactive getter. */
    knobY: () => number;
    /** Normalized axis after deadzone (-1 to 1). Reactive getter. */
    axisX: () => number;
    /** Normalized axis after deadzone (-1 to 1). Reactive getter. */
    axisY: () => number;
    /** Whether a touch is currently active. Reactive getter. */
    active: () => boolean;
    /** Base size in pixels. */
    size: number;
}

/**
 * Configuration options for {@link useVirtualJoystick}.
 */
export interface VirtualJoystickOptions {
    /** Screen position preset or custom CSS coordinates. Default: `'bottom-left'`. */
    position?: JoystickPosition;
    /** Outer diameter in pixels. Default: `120`. */
    size?: number;
    /** Deadzone radius as a fraction (0-1). Below this threshold, output is zero. Default: `0.15`. */
    deadzone?: number;
    /** Parent element to append the joystick to. Default: `document.body`. */
    parent?: HTMLElement;
    /** Custom render callback. Receives reactive state. Omit for default circle + knob visuals. */
    render?: (state: JoystickRenderState) => HTMLElement;
}

/**
 * Handle returned by {@link useVirtualJoystick} for controlling the joystick.
 */
export interface VirtualJoystickHandle {
    /** The root DOM element containing the joystick. */
    readonly element: HTMLElement;
    /** Current axis values after deadzone (-1 to 1 each). */
    readonly axes: { x: number; y: number };
    /** Show or hide the joystick. */
    setVisible(visible: boolean): void;
    /** Remove the joystick from the DOM and detach all listeners. */
    destroy(): void;
}

/** Default joystick size in pixels. */
const DEFAULT_SIZE = 120;
/** Default deadzone fraction. */
const DEFAULT_DEADZONE = 0.15;

/**
 * Creates a virtual joystick that injects into the input system's named axis action.
 * Handles touch ID tracking, displacement math, deadzone application,
 * input system injection, and cleanup.
 *
 * The hook owns all touch math. Visual rendering is pluggable via the `render`
 * option; when omitted, a default circle + knob design is used.
 *
 * @param axisAction - The input action name to inject axis values into (via `holdAxis2D`).
 * @param options - Configuration and optional custom render callback.
 * @returns A handle for controlling visibility, reading axis values, and cleanup.
 *
 * @example
 * ```ts
 * import { useVirtualJoystick } from '@pulse-ts/input';
 *
 * // Default visuals — zero config
 * const joystick = useVirtualJoystick('move', {
 *     position: 'bottom-left',
 *     size: 120,
 *     deadzone: 0.15,
 * });
 * ```
 *
 * @example
 * ```ts
 * import { useVirtualJoystick } from '@pulse-ts/input';
 *
 * // Custom visuals via render callback
 * const joystick = useVirtualJoystick('move', {
 *     position: 'bottom-right',
 *     render: (state) => {
 *         const el = document.createElement('div');
 *         el.style.width = `${state.size}px`;
 *         el.style.height = `${state.size}px`;
 *         // Use state.knobX(), state.knobY(), state.active() for updates
 *         return el;
 *     },
 * });
 * ```
 */
export function useVirtualJoystick(
    axisAction: string,
    options: VirtualJoystickOptions = {},
): VirtualJoystickHandle {
    const world = __fcCurrent().world;
    const svc = world.getService(InputService);
    if (!svc) {
        throw new Error(
            'InputService not provided. Call installInput(world) first.',
        );
    }

    const size = options.size ?? DEFAULT_SIZE;
    const deadzone = options.deadzone ?? DEFAULT_DEADZONE;
    const maxRadius = size / 2;

    // Mutable state tracked by touch handlers
    let activeTouchId: number | null = null;
    let currentKnobX = 0;
    let currentKnobY = 0;
    let currentAxisX = 0;
    let currentAxisY = 0;
    let isActive = false;

    // Build reactive state for render callback
    const renderState: JoystickRenderState = {
        knobX: () => currentKnobX,
        knobY: () => currentKnobY,
        axisX: () => currentAxisX,
        axisY: () => currentAxisY,
        active: () => isActive,
        size,
    };

    // Create root container
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.zIndex = '9999';
    container.style.touchAction = 'none';
    container.style.userSelect = 'none';
    applyPosition(container, options.position ?? 'bottom-left', size);

    // Build visual content
    let knobElement: HTMLElement | null = null;

    if (options.render) {
        const customEl = options.render(renderState);
        container.appendChild(customEl);
    } else {
        const { base, knob } = createDefaultVisuals(size);
        knobElement = knob;
        container.appendChild(base);
    }

    // Touch handlers
    const onTouchStart = (e: TouchEvent): void => {
        if (activeTouchId !== null) return; // Already tracking a touch
        const touch = e.changedTouches[0];
        if (!touch) return;

        const rect = container.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = touch.clientX - centerX;
        const dy = touch.clientY - centerY;

        // Only capture if touch is within the joystick bounds (generous)
        if (Math.abs(dx) > size && Math.abs(dy) > size) return;

        activeTouchId = touch.identifier;
        e.preventDefault();

        updateFromTouch(touch.clientX, touch.clientY, rect, svc);
    };

    const onTouchMove = (e: TouchEvent): void => {
        if (activeTouchId === null) return;
        const touch = findTouch(e.changedTouches, activeTouchId);
        if (!touch) return;
        e.preventDefault();

        const rect = container.getBoundingClientRect();
        updateFromTouch(touch.clientX, touch.clientY, rect, svc);
    };

    const onTouchEnd = (e: TouchEvent): void => {
        if (activeTouchId === null) return;
        const touch = findTouch(e.changedTouches, activeTouchId);
        if (!touch) return;
        e.preventDefault();

        activeTouchId = null;
        resetState(svc);
    };

    /**
     * Update joystick state from a touch position.
     */
    function updateFromTouch(
        touchX: number,
        touchY: number,
        rect: DOMRect,
        inputService: InputService,
    ): void {
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const displacement = computeDisplacement(
            centerX,
            centerY,
            touchX,
            touchY,
        );
        const output = applyDeadzone(displacement, maxRadius, deadzone);
        const clamped = clampToRadius(
            displacement.dx,
            displacement.dy,
            maxRadius,
        );

        currentKnobX = clamped.x;
        currentKnobY = clamped.y;
        currentAxisX = output.x;
        currentAxisY = -output.y;
        isActive = true;

        // Inject into input system as a held axis
        // Negate Y: screen-space Y (down = positive) → game-space Y (up = positive)
        inputService.holdAxis2D(axisAction, { x: output.x, y: -output.y });

        // Update default visuals
        updateDefaultVisuals();
    }

    /**
     * Reset joystick to center/inactive state.
     * Injects a zero hold before releasing so the last committed vec2 is zero.
     */
    function resetState(inputService: InputService): void {
        currentKnobX = 0;
        currentKnobY = 0;
        currentAxisX = 0;
        currentAxisY = 0;
        isActive = false;

        inputService.holdAxis2D(axisAction, { x: 0, y: 0 });
        updateDefaultVisuals();
    }

    /**
     * Update default knob element position and style.
     */
    function updateDefaultVisuals(): void {
        if (!knobElement) return;
        const center = size / 2;
        knobElement.style.left = `${center + currentKnobX - 20}px`;
        knobElement.style.top = `${center + currentKnobY - 20}px`;
        knobElement.style.background = isActive
            ? 'rgba(255, 255, 255, 0.6)'
            : 'rgba(255, 255, 255, 0.3)';
    }

    // Attach listeners to container
    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd, { passive: false });
    container.addEventListener('touchcancel', onTouchEnd, { passive: false });

    // Append to parent
    const parent = options.parent ?? document.body;
    parent.appendChild(container);

    // Build handle
    const handle: VirtualJoystickHandle = {
        get element() {
            return container;
        },
        get axes() {
            return { x: currentAxisX, y: currentAxisY };
        },
        setVisible(visible: boolean): void {
            container.style.display = visible ? '' : 'none';
        },
        destroy(): void {
            container.removeEventListener('touchstart', onTouchStart);
            container.removeEventListener('touchmove', onTouchMove);
            container.removeEventListener('touchend', onTouchEnd);
            container.removeEventListener('touchcancel', onTouchEnd);
            svc.releaseAxis2D(axisAction);
            container.remove();
        },
    };

    return handle;
}

/**
 * Apply a position preset or custom coordinates to a container element.
 *
 * @param el - The element to position.
 * @param position - Position preset or custom `{ x, y }` CSS values.
 * @param size - Joystick size in pixels (used for margin calculations).
 */
function applyPosition(
    el: HTMLElement,
    position: JoystickPosition,
    size: number,
): void {
    const margin = '20px';
    if (typeof position === 'string') {
        el.style.bottom = margin;
        if (position === 'bottom-left') {
            el.style.left = margin;
        } else {
            el.style.right = margin;
        }
    } else {
        el.style.left = position.x;
        el.style.top = position.y;
    }
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
}

/**
 * Create default circle + knob visual elements.
 *
 * @param size - Diameter of the outer circle in pixels.
 * @returns Object with `base` (outer circle) and `knob` (inner draggable) elements.
 */
function createDefaultVisuals(size: number): {
    base: HTMLElement;
    knob: HTMLElement;
} {
    const base = document.createElement('div');
    base.style.position = 'relative';
    base.style.width = `${size}px`;
    base.style.height = `${size}px`;
    base.style.borderRadius = '50%';
    base.style.border = '2px solid rgba(255, 255, 255, 0.2)';
    base.style.background = 'rgba(0, 0, 0, 0.15)';
    base.style.boxSizing = 'border-box';

    const knobSize = 40;
    const knob = document.createElement('div');
    knob.style.position = 'absolute';
    knob.style.width = `${knobSize}px`;
    knob.style.height = `${knobSize}px`;
    knob.style.borderRadius = '50%';
    knob.style.background = 'rgba(255, 255, 255, 0.3)';
    knob.style.left = `${size / 2 - knobSize / 2}px`;
    knob.style.top = `${size / 2 - knobSize / 2}px`;
    knob.style.transition = 'background 0.1s';
    knob.style.pointerEvents = 'none';

    base.appendChild(knob);
    return { base, knob };
}

/**
 * Find a specific touch by identifier in a TouchList.
 *
 * @param touches - The TouchList to search.
 * @param id - The touch identifier to find.
 * @returns The matching Touch, or undefined.
 */
function findTouch(touches: TouchList, id: number): Touch | undefined {
    for (let i = 0; i < touches.length; i++) {
        if (touches[i].identifier === id) return touches[i];
    }
    return undefined;
}
