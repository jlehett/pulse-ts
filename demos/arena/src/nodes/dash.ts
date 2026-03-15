/**
 * Dash mechanic — timer, cooldown, direction state, and activation logic.
 */

import { useTimer, useCooldown } from '@pulse-ts/core';
import { computeDashDirection } from './mechanics';

/** Velocity applied during a dash. */
export const DASH_SPEED = 24;

/** Duration of a dash in seconds. */
export const DASH_DURATION = 0.15;

/** Cooldown between dashes in seconds. */
export const DASH_COOLDOWN = 1.0;

export interface DashState {
    /** The dash timer instance. */
    timer: ReturnType<typeof useTimer>;
    /** The dash cooldown instance. */
    cooldown: ReturnType<typeof useCooldown>;
    /** Current dash direction X component. */
    dirX: number;
    /** Current dash direction Z component. */
    dirZ: number;
}

/**
 * Initialize dash state with timer and cooldown hooks.
 * Call at the top level of a node function.
 *
 * @returns Mutable dash state object.
 *
 * @example
 * ```ts
 * const dash = useDash();
 * // In fixed update:
 * tryActivateDash(dash, move.x, move.y, dashAction.pressed, dashSfx);
 * ```
 */
export function useDash(): DashState {
    return {
        timer: useTimer(DASH_DURATION),
        cooldown: useCooldown(DASH_COOLDOWN),
        dirX: 0,
        dirZ: 0,
    };
}

/**
 * Attempt to activate a dash. Mutates dash state if successful.
 *
 * @param dash - The dash state from {@link useDash}.
 * @param moveX - Current horizontal input.
 * @param moveY - Current vertical input.
 * @param pressed - Whether the dash button was pressed this tick.
 * @param onDash - Callback invoked when dash activates (e.g. play sound).
 * @returns Whether a dash was activated.
 */
export function tryActivateDash(
    dash: DashState,
    moveX: number,
    moveY: number,
    pressed: boolean,
    onDash?: () => void,
): boolean {
    if (pressed && dash.cooldown.ready && !dash.timer.active) {
        [dash.dirX, dash.dirZ] = computeDashDirection(moveX, moveY);
        dash.timer.reset();
        dash.cooldown.trigger();
        onDash?.();
        return true;
    }
    return false;
}
