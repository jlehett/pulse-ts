import {
    useDestroy,
    useContext,
    useFrameUpdate,
    useStore,
} from '@pulse-ts/core';
import { useInput, useVirtualJoystick } from '@pulse-ts/input';
import { isMobile } from '@pulse-ts/platform';
import { GameCtx } from '../../contexts';
import { ReplayStore } from '../../stores/replay';
import { DashCooldownStore } from '../../stores/dashCooldown';

/** Dash button radius in pixels. */
const DASH_RADIUS = 35;

/** Pause button size in pixels. */
const PAUSE_SIZE = 44;

// ────────────────────────────── Props ──────────────────────────────

export interface TouchControlsNodeProps {
    /** Local player ID for reading dash cooldown progress. @defaultValue `0` */
    playerId?: number;
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
 * The controls only render on mobile/tablet devices. On desktop — including
 * touch-enabled laptops — the node is a no-op.
 *
 * Multi-touch is supported — the player can move and dash simultaneously
 * by tracking separate touch identifiers per control.
 */
export function TouchControlsNode(props?: Readonly<TouchControlsNodeProps>) {
    // Gate: only show on mobile/tablet devices (not touch-enabled laptops)
    if (!isMobile()) return;

    const input = useInput();
    const localPlayerId = props?.playerId ?? 0;
    const moveAction = props?.moveAction ?? 'p1Move';
    const dashAction = props?.dashAction ?? 'p1Dash';

    // Track active touch IDs for non-joystick controls
    let dashTouchId: number | null = null;
    let pauseTouchId: number | null = null;

    // ── Joystick (via useVirtualJoystick hook) ──

    const joystick = useVirtualJoystick(moveAction, {
        position: 'bottom-left',
        size: 120,
        deadzone: 0.15,
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
    const [replay] = useStore(ReplayStore);
    const [cooldown] = useStore(DashCooldownStore);

    useFrameUpdate(() => {
        const hidden =
            gameState.phase === 'intro' ||
            (gameState.phase === 'replay' && replay.active);
        const vis = hidden ? 'hidden' : 'visible';
        joystick.setVisible(!hidden);
        dashBtn.style.visibility = vis;
        pauseBtn.style.visibility = vis;

        // Dash cooldown fill — fills from bottom to top as cooldown recovers
        if (!hidden) {
            const progress = cooldown.progress[localPlayerId];
            if (progress >= 1) {
                dashBtn.style.background = 'rgba(72,201,176,0.25)';
            } else {
                const pct = Math.round(progress * 100);
                dashBtn.style.background = `linear-gradient(to top, rgba(72,201,176,0.25) ${pct}%, rgba(72,201,176,0.08) ${pct}%)`;
            }
        }
    });

    // ── Cleanup ──

    useDestroy(() => {
        // Release any active holds
        input.injectDigital(dashAction, 'touch:dash', false);
        input.injectDigital('pause', 'touch:pause', false);

        // Destroy the joystick (removes DOM + releases axis)
        joystick.destroy();

        // Remove listeners
        dashBtn.removeEventListener('touchstart', onDashTouchStart);
        dashBtn.removeEventListener('touchend', onDashTouchEnd);
        dashBtn.removeEventListener('touchcancel', onDashTouchEnd);
        pauseBtn.removeEventListener('touchstart', onPauseTouchStart);
        pauseBtn.removeEventListener('touchend', onPauseTouchEnd);
        pauseBtn.removeEventListener('touchcancel', onPauseTouchEnd);

        // Remove DOM elements
        dashBtn.remove();
        pauseBtn.remove();
    });
}
