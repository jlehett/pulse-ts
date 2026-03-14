import { useFrameUpdate, useDestroy, useContext, color } from '@pulse-ts/core';
import { useThreeContext } from '@pulse-ts/three';
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

    // Root overlay — full-width banner flush with the top of the screen
    const el = document.createElement('div');
    Object.assign(el.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        zIndex: '3000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '4px',
        padding: 'clamp(16px, 3vw, 32px) clamp(20px, 4vw, 48px)',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        pointerEvents: 'none',
        transition: `opacity ${FADE_OUT_MS}ms ease-out`,
        opacity: '0',
    } as Partial<CSSStyleDeclaration>);
    container.appendChild(el);

    // "VS" label
    const vsLabel = document.createElement('div');
    vsLabel.textContent = 'VS';
    Object.assign(vsLabel.style, {
        font: 'bold clamp(20px, 5vw, 32px) monospace',
        color: '#888',
        letterSpacing: '4px',
    } as Partial<CSSStyleDeclaration>);
    el.appendChild(vsLabel);

    // Personality name
    const nameLabel = document.createElement('div');
    nameLabel.textContent = personality.name.toUpperCase();
    Object.assign(nameLabel.style, {
        font: 'bold clamp(32px, 10vw, 56px) monospace',
        color: color(personality.color).rgb,
        textShadow: `0 0 20px ${color(personality.color).rgb}`,
        letterSpacing: '3px',
    } as Partial<CSSStyleDeclaration>);
    el.appendChild(nameLabel);

    // Tagline
    const taglineLabel = document.createElement('div');
    taglineLabel.textContent = personality.tagline;
    Object.assign(taglineLabel.style, {
        font: 'clamp(12px, 3vw, 16px) monospace',
        color: '#888',
        marginTop: '4px',
    } as Partial<CSSStyleDeclaration>);
    el.appendChild(taglineLabel);

    // Staggered entrance animation
    applyStaggeredEntrance([vsLabel, nameLabel, taglineLabel], 200);

    let elapsed = 0;
    let fadingOut = false;

    useFrameUpdate((dt) => {
        if (gameState.phase !== 'intro') {
            el.style.opacity = '0';
            return;
        }

        // Show the overlay
        if (!fadingOut) {
            el.style.opacity = '1';
        }

        elapsed += dt;

        if (elapsed >= INTRO_DURATION && !fadingOut) {
            fadingOut = true;
            el.style.opacity = '0';
            // Transition to countdown (3-2-1-GO!) after fade completes
            setTimeout(() => {
                gameState.phase = 'countdown';
            }, FADE_OUT_MS);
        }
    });

    useDestroy(() => {
        el.remove();
    });
}
