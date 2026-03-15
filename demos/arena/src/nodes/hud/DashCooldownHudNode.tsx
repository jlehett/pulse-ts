import { useFrameUpdate, useContext, useStore } from '@pulse-ts/core';
import { useThreeContext } from '@pulse-ts/three';
import { useOverlay, Column } from '@pulse-ts/dom';
import { isMobile } from '@pulse-ts/platform';
import { GameCtx } from '../contexts';
import { DashCooldownStore } from '../dashCooldown';
import { ReplayStore } from '../replay';

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
    // Only render on desktop --- mobile uses the dash button fill
    if (isMobile()) return;

    const gameState = useContext(GameCtx);
    const { renderer } = useThreeContext();
    const container = renderer.domElement.parentElement ?? document.body;
    const [cooldown] = useStore(DashCooldownStore);
    const [replay] = useStore(ReplayStore);

    let wrapperOpacity = '0';
    let fillWidth = '0%';

    useOverlay(
        <Column
            gap={0}
            style={{
                position: 'absolute',
                bottom: 'clamp(20px, 3vw, 48px)',
                left: 'clamp(20px, 3vw, 48px)',
                gap: 'clamp(4px, 0.5vw, 8px)',
                pointerEvents: 'none',
                zIndex: '2000',
                opacity: () => wrapperOpacity,
            }}
        >
            <div
                style={{
                    font: 'bold clamp(13px, 1.5vw, 20px) monospace',
                    color: 'rgba(255,255,255,0.45)',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    userSelect: 'none',
                }}
            >
                Dash Cooldown
            </div>
            <div
                style={{
                    width: 'clamp(140px, 16vw, 280px)',
                    height: 'clamp(10px, 1.4vw, 18px)',
                    borderRadius: 'clamp(5px, 0.7vw, 9px)',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    overflow: 'hidden',
                    position: 'relative',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        left: '0',
                        top: '0',
                        height: '100%',
                        width: () => fillWidth,
                        borderRadius: 'inherit',
                        backgroundColor: 'rgba(72,201,176,0.6)',
                    }}
                />
            </div>
        </Column>,
        container,
    );

    useFrameUpdate(() => {
        const hidden =
            gameState.phase === 'intro' ||
            (gameState.phase === 'replay' && replay.active);

        if (hidden) {
            wrapperOpacity = '0';
            return;
        }

        const progress = cooldown.progress[props?.playerId ?? 0];
        const pct = Math.min(100, Math.round(progress * 100));
        fillWidth = `${pct}%`;

        // Fully ready --- hide so it doesn't clutter the screen
        wrapperOpacity = progress >= 1 ? '0' : '1';
    });
}
