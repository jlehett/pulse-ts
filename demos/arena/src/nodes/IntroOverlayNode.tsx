import { useFrameUpdate, useContext, color } from '@pulse-ts/core';
import { useThreeContext } from '@pulse-ts/three';
import { useOverlay, Column } from '@pulse-ts/dom';
import { useSequence } from '@pulse-ts/effects';
import { GameCtx } from '../contexts';
import { applyStaggeredEntrance } from '../overlayAnimations';
import type { AiPersonality } from '../ai/personalities';

/** Duration of the intro cinematic in seconds before transitioning to playing. */
export const INTRO_DURATION = 3.0;

/** Fade-out duration in milliseconds. */
const FADE_OUT_MS = 400;

export interface IntroOverlayNodeProps {
    /** The AI personality to display during the intro. */
    personality: AiPersonality;
}

/**
 * DOM overlay shown during the `'intro'` phase in solo mode.
 * Displays "VS" label, personality name (in accent color), and tagline.
 * After {@link INTRO_DURATION} seconds, fades out and transitions the
 * game to the `'countdown'` phase (3-2-1-GO!).
 *
 * @param props - Intro overlay configuration.
 */
export function IntroOverlayNode({
    personality,
}: Readonly<IntroOverlayNodeProps>) {
    const gameState = useContext(GameCtx);
    const { renderer } = useThreeContext();
    const container = renderer.domElement.parentElement ?? document.body;

    const accentColor = color(personality.color).rgb;

    const root = useOverlay(
        <Column
            style={{
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                zIndex: '3000',
                alignItems: 'flex-start',
                gap: '4px',
                padding: 'clamp(16px, 3vw, 32px) clamp(20px, 4vw, 48px)',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                pointerEvents: 'none',
                transition: `opacity ${FADE_OUT_MS}ms ease-out`,
                opacity: '0',
            }}
        >
            <div
                style={{
                    font: 'bold clamp(20px, 5vw, 32px) monospace',
                    color: '#888',
                    letterSpacing: '4px',
                }}
            >
                VS
            </div>
            <div
                style={{
                    font: 'bold clamp(32px, 10vw, 56px) monospace',
                    color: accentColor,
                    textShadow: `0 0 20px ${accentColor}`,
                    letterSpacing: '3px',
                }}
            >
                {personality.name.toUpperCase()}
            </div>
            <div
                style={{
                    font: 'clamp(12px, 3vw, 16px) monospace',
                    color: '#888',
                    marginTop: '4px',
                }}
            >
                {personality.tagline}
            </div>
        </Column>,
        container,
    );

    // Staggered entrance animation
    const rootEl = root as HTMLElement;
    const vsLabel = rootEl.children[0] as HTMLElement;
    const nameLabel = rootEl.children[1] as HTMLElement;
    const taglineLabel = rootEl.children[2] as HTMLElement;
    applyStaggeredEntrance([vsLabel, nameLabel, taglineLabel], 200);

    // Declarative intro sequence: show → fade out → transition to countdown
    const introSequence = useSequence([
        { action: () => { rootEl.style.opacity = '1'; }, post: INTRO_DURATION },
        { action: () => { rootEl.style.opacity = '0'; }, post: FADE_OUT_MS / 1000 },
        { action: () => { gameState.phase = 'countdown'; } },
    ]);

    useFrameUpdate(() => {
        if (gameState.phase !== 'intro') {
            rootEl.style.opacity = '0';
            return;
        }

        if (!introSequence.finished && introSequence.elapsed === 0) {
            introSequence.play();
        }
    });
}
