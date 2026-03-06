import { useFrameUpdate, useDestroy, useContext } from '@pulse-ts/core';
import { useThreeContext } from '@pulse-ts/three';
import { isMobileDevice } from '../isMobileDevice';
import { GameCtx } from '../contexts';
import { getDashCooldownProgress } from '../dashCooldown';
import { isReplayActive } from '../replay';

export interface DashCooldownHudNodeProps {
    /** Local player ID for reading dash cooldown progress. @defaultValue `0` */
    playerId?: number;
}

/**
 * Small HUD element showing dash cooldown progress for desktop (non-mobile)
 * players. Positioned at the bottom-left corner with a "DASH COOLDOWN" label.
 * Sizes scale with the viewport via `clamp()`. Fills from left to right as the
 * cooldown recovers. Hidden on mobile devices (where the dash button shows its
 * own fill effect), during intro cinematics, and during replays.
 */
export function DashCooldownHudNode(
    props?: Readonly<DashCooldownHudNodeProps>,
) {
    // Only render on desktop — mobile uses the dash button fill
    if (isMobileDevice()) return;

    const gameState = useContext(GameCtx);
    const { renderer } = useThreeContext();
    const container = renderer.domElement.parentElement ?? document.body;

    // Wrapper — positions and holds both label and bar
    const wrapper = document.createElement('div');
    Object.assign(wrapper.style, {
        position: 'absolute',
        bottom: 'clamp(20px, 3vw, 48px)',
        left: 'clamp(20px, 3vw, 48px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'clamp(4px, 0.5vw, 8px)',
        pointerEvents: 'none',
        zIndex: '2000',
        opacity: '0',
    } as Partial<CSSStyleDeclaration>);
    container.appendChild(wrapper);

    // Label
    const label = document.createElement('div');
    Object.assign(label.style, {
        font: 'bold clamp(13px, 1.5vw, 20px) monospace',
        color: 'rgba(255,255,255,0.45)',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        userSelect: 'none',
    } as Partial<CSSStyleDeclaration>);
    label.textContent = 'Dash Cooldown';
    wrapper.appendChild(label);

    // Outer track (dark background)
    const track = document.createElement('div');
    Object.assign(track.style, {
        width: 'clamp(140px, 16vw, 280px)',
        height: 'clamp(10px, 1.4vw, 18px)',
        borderRadius: 'clamp(5px, 0.7vw, 9px)',
        backgroundColor: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.15)',
        overflow: 'hidden',
    } as Partial<CSSStyleDeclaration>);
    wrapper.appendChild(track);

    // Inner fill bar
    const fill = document.createElement('div');
    Object.assign(fill.style, {
        position: 'absolute',
        left: '0',
        top: '0',
        height: '100%',
        width: '0%',
        borderRadius: 'inherit',
        backgroundColor: 'rgba(72,201,176,0.6)',
    } as Partial<CSSStyleDeclaration>);
    track.style.position = 'relative';
    track.appendChild(fill);

    useFrameUpdate(() => {
        const hidden =
            gameState.phase === 'intro' ||
            (gameState.phase === 'replay' && isReplayActive());
        wrapper.style.opacity = hidden ? '0' : '1';

        if (!hidden) {
            const progress = getDashCooldownProgress(props?.playerId ?? 0);
            const pct = Math.min(100, Math.round(progress * 100));
            fill.style.width = `${pct}%`;

            // Fully ready — hide so it doesn't clutter the screen
            wrapper.style.opacity = progress >= 1 ? '0' : '1';
        }
    });

    useDestroy(() => {
        wrapper.remove();
    });
}
