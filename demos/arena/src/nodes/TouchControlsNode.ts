import { useDestroy, useContext, useFrameUpdate } from '@pulse-ts/core';
import { useInput } from '@pulse-ts/input';
import { isMobileDevice } from '../isMobileDevice';
import { GameCtx } from '../contexts';
import { isReplayActive } from '../replay';

/** Default deadzone — inputs within this magnitude are zeroed. */
const DEADZONE = 0.15;

/** Joystick base radius in pixels. */
const BASE_RADIUS = 60;

/** Joystick knob radius in pixels. */
const KNOB_RADIUS = 25;

/** Dash button radius in pixels. */
const DASH_RADIUS = 35;

/** Pause button size in pixels. */
const PAUSE_SIZE = 44;

// ────────────────────────────── Pure helpers ──────────────────────────────

/**
 * Compute normalized joystick displacement from a touch position.
 *
 * Returns `{ dx, dy }` where each component is in `[-1, 1]`. Values are
 * clamped to the unit circle (magnitude <= 1) and Y is inverted so that
 * dragging upward on screen produces a positive `dy` (forward in game).
 *
 * @param touchX - Touch clientX.
 * @param touchY - Touch clientY.
 * @param centerX - Joystick base center X.
 * @param centerY - Joystick base center Y.
 * @param radius - Joystick base radius in pixels.
 * @returns Normalized displacement.
 *
 * @example
 * ```ts
 * const d = computeJoystickDisplacement(160, 400, 100, 400, 60);
 * // d.dx = 1, d.dy = 0 (full right)
 * ```
 */
export function computeJoystickDisplacement(
    touchX: number,
    touchY: number,
    centerX: number,
    centerY: number,
    radius: number,
): { dx: number; dy: number } {
    const rawDx = (touchX - centerX) / radius;
    const rawDy = -(touchY - centerY) / radius; // invert Y
    const mag = Math.sqrt(rawDx * rawDx + rawDy * rawDy);
    if (mag <= 1) return { dx: rawDx, dy: rawDy };
    return { dx: rawDx / mag, dy: rawDy / mag };
}

/**
 * Apply a radial deadzone to joystick axes. When the displacement magnitude
 * is below the deadzone threshold, both axes return 0.
 *
 * @param dx - Horizontal displacement in `[-1, 1]`.
 * @param dy - Vertical displacement in `[-1, 1]`.
 * @param deadzone - Minimum magnitude threshold (e.g., 0.15).
 * @returns Axis values for input injection.
 *
 * @example
 * ```ts
 * applyDeadzone(0.05, 0.02, 0.15); // { x: 0, y: 0 }
 * applyDeadzone(0.8, 0.5, 0.15);   // { x: 0.8, y: 0.5 }
 * ```
 */
export function applyDeadzone(
    dx: number,
    dy: number,
    deadzone: number,
): { x: number; y: number } {
    const mag = Math.sqrt(dx * dx + dy * dy);
    if (mag < deadzone) return { x: 0, y: 0 };
    return { x: dx, y: dy };
}

// ────────────────────────────── Props ──────────────────────────────

export interface TouchControlsNodeProps {
    /** Input action name for 2D movement axis. @defaultValue `'p1Move'` */
    moveAction?: string;
    /** Input action name for the dash digital action. @defaultValue `'p1Dash'` */
    dashAction?: string;
}

// ────────────────────────────── Node ──────────────────────────────

/**
 * On-screen touch controls for mobile devices: a virtual joystick (left)
 * for analog movement, a dash button (right), and a pause button (top-right).
 *
 * The controls only render on mobile/tablet devices (detected via the
 * `pointer: coarse` media query). On desktop — including touch-enabled
 * laptops — the node is a no-op.
 *
 * Multi-touch is supported — the player can move and dash simultaneously
 * by tracking separate touch identifiers per control.
 */
export function TouchControlsNode(props?: Readonly<TouchControlsNodeProps>) {
    // Gate: only show on mobile/tablet devices (not touch-enabled laptops)
    if (!isMobileDevice()) return;

    const input = useInput();
    const moveAction = props?.moveAction ?? 'p1Move';
    const dashAction = props?.dashAction ?? 'p1Dash';

    // Track active touch IDs
    let joystickTouchId: number | null = null;
    let dashTouchId: number | null = null;
    let pauseTouchId: number | null = null;

    // ── Joystick ──

    const joystickBase = document.createElement('div');
    Object.assign(joystickBase.style, {
        position: 'fixed',
        left: '30px',
        bottom: '30px',
        width: `${BASE_RADIUS * 2}px`,
        height: `${BASE_RADIUS * 2}px`,
        borderRadius: '50%',
        backgroundColor: 'rgba(255,255,255,0.12)',
        border: '2px solid rgba(255,255,255,0.25)',
        touchAction: 'none',
        zIndex: '5000',
        pointerEvents: 'auto',
    } as Partial<CSSStyleDeclaration>);
    document.body.appendChild(joystickBase);

    const joystickKnob = document.createElement('div');
    Object.assign(joystickKnob.style, {
        position: 'absolute',
        left: `${BASE_RADIUS - KNOB_RADIUS}px`,
        top: `${BASE_RADIUS - KNOB_RADIUS}px`,
        width: `${KNOB_RADIUS * 2}px`,
        height: `${KNOB_RADIUS * 2}px`,
        borderRadius: '50%',
        backgroundColor: 'rgba(255,255,255,0.45)',
        touchAction: 'none',
        pointerEvents: 'none',
        transition: 'background-color 0.1s',
    } as Partial<CSSStyleDeclaration>);
    joystickBase.appendChild(joystickKnob);

    function getJoystickCenter(): { cx: number; cy: number } {
        const rect = joystickBase.getBoundingClientRect();
        return { cx: rect.left + BASE_RADIUS, cy: rect.top + BASE_RADIUS };
    }

    function updateJoystick(touchX: number, touchY: number): void {
        const { cx, cy } = getJoystickCenter();
        const { dx, dy } = computeJoystickDisplacement(
            touchX,
            touchY,
            cx,
            cy,
            BASE_RADIUS,
        );
        const axes = applyDeadzone(dx, dy, DEADZONE);
        input.holdAxis2D(moveAction, axes);

        // Move knob visually (clamped to base radius)
        const visualX = dx * BASE_RADIUS;
        const visualY = -dy * BASE_RADIUS; // re-invert for screen coords
        joystickKnob.style.left = `${BASE_RADIUS - KNOB_RADIUS + visualX}px`;
        joystickKnob.style.top = `${BASE_RADIUS - KNOB_RADIUS + visualY}px`;
    }

    function resetJoystick(): void {
        joystickTouchId = null;
        input.releaseAxis2D(moveAction);
        joystickKnob.style.left = `${BASE_RADIUS - KNOB_RADIUS}px`;
        joystickKnob.style.top = `${BASE_RADIUS - KNOB_RADIUS}px`;
        joystickKnob.style.backgroundColor = 'rgba(255,255,255,0.45)';
    }

    function onJoystickTouchStart(e: TouchEvent): void {
        e.preventDefault();
        if (joystickTouchId !== null) return; // already tracking
        const t = e.changedTouches[0];
        joystickTouchId = t.identifier;
        joystickKnob.style.backgroundColor = 'rgba(255,255,255,0.7)';
        updateJoystick(t.clientX, t.clientY);
    }

    function onJoystickTouchMove(e: TouchEvent): void {
        e.preventDefault();
        if (joystickTouchId === null) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            if (t.identifier === joystickTouchId) {
                updateJoystick(t.clientX, t.clientY);
                return;
            }
        }
    }

    function onJoystickTouchEnd(e: TouchEvent): void {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === joystickTouchId) {
                resetJoystick();
                return;
            }
        }
    }

    joystickBase.addEventListener('touchstart', onJoystickTouchStart, {
        passive: false,
    });
    joystickBase.addEventListener('touchmove', onJoystickTouchMove, {
        passive: false,
    });
    joystickBase.addEventListener('touchend', onJoystickTouchEnd, {
        passive: false,
    });
    joystickBase.addEventListener('touchcancel', onJoystickTouchEnd, {
        passive: false,
    });

    // ── Dash button ──

    const dashBtn = document.createElement('div');
    Object.assign(dashBtn.style, {
        position: 'fixed',
        right: '40px',
        bottom: '50px',
        width: `${DASH_RADIUS * 2}px`,
        height: `${DASH_RADIUS * 2}px`,
        borderRadius: '50%',
        backgroundColor: 'rgba(72,201,176,0.25)',
        border: '2px solid rgba(72,201,176,0.5)',
        touchAction: 'none',
        zIndex: '5000',
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        font: 'bold 14px monospace',
        color: 'rgba(255,255,255,0.7)',
        userSelect: 'none',
    } as Partial<CSSStyleDeclaration>);
    dashBtn.textContent = 'DASH';
    document.body.appendChild(dashBtn);

    function onDashTouchStart(e: TouchEvent): void {
        e.preventDefault();
        if (dashTouchId !== null) return;
        dashTouchId = e.changedTouches[0].identifier;
        dashBtn.style.backgroundColor = 'rgba(72,201,176,0.5)';
        input.injectDigital(dashAction, 'touch:dash', true);
    }

    function onDashTouchEnd(e: TouchEvent): void {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === dashTouchId) {
                dashTouchId = null;
                dashBtn.style.backgroundColor = 'rgba(72,201,176,0.25)';
                input.injectDigital(dashAction, 'touch:dash', false);
                return;
            }
        }
    }

    dashBtn.addEventListener('touchstart', onDashTouchStart, {
        passive: false,
    });
    dashBtn.addEventListener('touchend', onDashTouchEnd, { passive: false });
    dashBtn.addEventListener('touchcancel', onDashTouchEnd, { passive: false });

    // ── Pause button ──

    const pauseBtn = document.createElement('div');
    Object.assign(pauseBtn.style, {
        position: 'fixed',
        right: '16px',
        top: '16px',
        width: `${PAUSE_SIZE}px`,
        height: `${PAUSE_SIZE}px`,
        borderRadius: '8px',
        backgroundColor: 'rgba(255,255,255,0.1)',
        border: '2px solid rgba(255,255,255,0.2)',
        touchAction: 'none',
        zIndex: '5000',
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        font: 'bold 18px sans-serif',
        color: 'rgba(255,255,255,0.6)',
        userSelect: 'none',
    } as Partial<CSSStyleDeclaration>);
    pauseBtn.textContent = 'II';
    document.body.appendChild(pauseBtn);

    function onPauseTouchStart(e: TouchEvent): void {
        e.preventDefault();
        if (pauseTouchId !== null) return;
        pauseTouchId = e.changedTouches[0].identifier;
        pauseBtn.style.backgroundColor = 'rgba(255,255,255,0.25)';
        input.injectDigital('pause', 'touch:pause', true);
    }

    function onPauseTouchEnd(e: TouchEvent): void {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === pauseTouchId) {
                pauseTouchId = null;
                pauseBtn.style.backgroundColor = 'rgba(255,255,255,0.1)';
                input.injectDigital('pause', 'touch:pause', false);
                return;
            }
        }
    }

    pauseBtn.addEventListener('touchstart', onPauseTouchStart, {
        passive: false,
    });
    pauseBtn.addEventListener('touchend', onPauseTouchEnd, { passive: false });
    pauseBtn.addEventListener('touchcancel', onPauseTouchEnd, {
        passive: false,
    });

    // ── Hide during replay ──

    const gameState = useContext(GameCtx);

    useFrameUpdate(() => {
        const inReplay = gameState.phase === 'replay' && isReplayActive();
        const vis = inReplay ? 'hidden' : 'visible';
        joystickBase.style.visibility = vis;
        dashBtn.style.visibility = vis;
        pauseBtn.style.visibility = vis;
    });

    // ── Cleanup ──

    useDestroy(() => {
        // Release any active holds
        input.releaseAxis2D(moveAction);
        input.injectDigital(dashAction, 'touch:dash', false);
        input.injectDigital('pause', 'touch:pause', false);

        // Remove listeners
        joystickBase.removeEventListener('touchstart', onJoystickTouchStart);
        joystickBase.removeEventListener('touchmove', onJoystickTouchMove);
        joystickBase.removeEventListener('touchend', onJoystickTouchEnd);
        joystickBase.removeEventListener('touchcancel', onJoystickTouchEnd);
        dashBtn.removeEventListener('touchstart', onDashTouchStart);
        dashBtn.removeEventListener('touchend', onDashTouchEnd);
        dashBtn.removeEventListener('touchcancel', onDashTouchEnd);
        pauseBtn.removeEventListener('touchstart', onPauseTouchStart);
        pauseBtn.removeEventListener('touchend', onPauseTouchEnd);
        pauseBtn.removeEventListener('touchcancel', onPauseTouchEnd);

        // Remove DOM elements
        joystickBase.remove();
        dashBtn.remove();
        pauseBtn.remove();
    });
}
