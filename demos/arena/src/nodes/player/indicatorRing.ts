/**
 * Indicator ring — a screen-space CSS circle that tracks the local player's
 * position. Used in online mode to distinguish "you" from the remote player.
 */

import {
    color,
    useDestroy,
} from '@pulse-ts/core';
import {
    useThreeContext,
    useScreenProjection,
} from '@pulse-ts/three';

/** Color of the online-mode "you" indicator ring (hex). */
export const INDICATOR_RING_COLOR = 0xffee88;

/** Screen-space scale multiplier vs projected player radius. */
export const INDICATOR_RING_SCALE = 1.5;

/** Border width of the indicator ring in pixels. */
export const INDICATOR_RING_BORDER = 2;

export interface IndicatorRingHandle {
    /** The DOM element, or null if not created. */
    element: HTMLDivElement | null;
    /** The screen-projection function for positioning. */
    project: ReturnType<typeof useScreenProjection>;
    /** Update the ring's screen position from a world-space position. */
    updatePosition: (
        position: { x: number; y: number; z: number },
        visible: boolean,
    ) => void;
}

/**
 * Create and manage an indicator ring DOM element.
 * Call this at the top level of a node function (hooks are used internally).
 *
 * @param enabled - Whether to create the ring. When false, returns a no-op handle.
 * @param playerRadius - The player sphere radius for screen-space sizing. Defaults to 0.8.
 * @returns A handle for updating and reading the ring state.
 *
 * @example
 * ```ts
 * const ring = useIndicatorRing(replicate || showIndicatorRing);
 * // In frame update:
 * ring.updatePosition(root.position, gameState.phase === 'playing');
 * ```
 */
export function useIndicatorRing(enabled: boolean, playerRadius: number = 0.8): IndicatorRingHandle {
    const project = useScreenProjection();
    const { renderer: threeRenderer } = useThreeContext();

    let indicatorRing: HTMLDivElement | null = null;

    if (enabled) {
        const container =
            threeRenderer.domElement.parentElement ?? document.body;
        indicatorRing = document.createElement('div');
        const indicatorColor = color(INDICATOR_RING_COLOR);
        const cssColor = indicatorColor.rgba(0.7);
        const glowColor = indicatorColor.rgba(0.4);
        Object.assign(indicatorRing.style, {
            position: 'absolute',
            borderRadius: '50%',
            border: `${INDICATOR_RING_BORDER}px solid ${cssColor}`,
            boxShadow: `0 0 8px ${glowColor}`,
            pointerEvents: 'none',
            zIndex: '999',
        } as Partial<CSSStyleDeclaration>);
        container.appendChild(indicatorRing);

        useDestroy(() => indicatorRing!.remove());
    }

    const updatePosition = (
        position: { x: number; y: number; z: number },
        visible: boolean,
    ): void => {
        if (!indicatorRing) return;

        if (!visible) {
            indicatorRing.style.display = 'none';
            return;
        }

        indicatorRing.style.display = '';

        const center = project(position);
        const sx = center.x;
        const sy = center.y;

        const edge = project({
            x: position.x + playerRadius * INDICATOR_RING_SCALE,
            y: position.y,
            z: position.z,
        });
        const radius = Math.abs(edge.x - sx);
        const size = radius * 2;

        indicatorRing.style.width = `${size}px`;
        indicatorRing.style.height = `${size}px`;
        indicatorRing.style.left = `${sx - radius}px`;
        indicatorRing.style.top = `${sy - radius}px`;
    };

    return {
        element: indicatorRing,
        project,
        updatePosition,
    };
}
