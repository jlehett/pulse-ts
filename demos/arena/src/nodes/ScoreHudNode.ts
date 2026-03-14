import {
    useFrameUpdate,
    useDestroy,
    useContext,
    useStore,
} from '@pulse-ts/core';
import { useThreeContext } from '@pulse-ts/three';
import { GameCtx } from '../contexts';
import { ReplayStore, isReplayActive } from '../replay';
import { ANIM_EASING } from '../overlayAnimations';

/** Player colors: P1 = teal, P2 = coral. */
export const SCORE_COLORS = ['#48c9b0', '#e74c3c'];

/** Duration (ms) of the score-change flash animation. */
const FLASH_DURATION = 500;

/** Delay (ms) after replay ends before syncing scores, so the HUD is visible. */
const SCORE_REVEAL_DELAY = 350;

/**
 * Pixel offset for the inward-angling edges of the trapezoid.
 * The top of each panel is wider than the bottom by this amount.
 */
const TAPER_PX = 12;

/** Border width (px) for the white outline on the sides and bottom. */
const BORDER_PX = 2;

/** Radius (px) for the rounded bottom corners of the trapezoid. */
const CORNER_R = 6;

/**
 * Build a trapezoidal clip-path polygon string that is wider at the top
 * and tapers inward at the bottom, with rounded bottom corners approximated
 * by extra polygon points.
 *
 * @param taper - How many px the bottom is narrower than the top on each side.
 * @param r - Approximate corner radius in px.
 * @returns A CSS `polygon(...)` value.
 */
function trapezoidClip(taper: number, r: number): string {
    // Extra polygon points approximate a curve at each bottom corner.
    // Bottom-left corner is at (taper, 100%). Bottom-right is at (100%-taper, 100%).
    return `polygon(
        0 0,
        100% 0,
        calc(100% - ${taper - 1}px) calc(100% - ${r}px),
        calc(100% - ${taper + 1}px) calc(100% - ${Math.round(r * 0.3)}px),
        calc(100% - ${taper + r}px) 100%,
        ${taper + r}px 100%,
        ${taper + 1}px calc(100% - ${Math.round(r * 0.3)}px),
        ${taper - 1}px calc(100% - ${r}px)
    )`;
}

/**
 * Create a score number span.
 *
 * @returns The span element.
 */
function createNum(): HTMLSpanElement {
    const num = document.createElement('span');
    Object.assign(num.style, {
        color: '#ffffff',
        fontWeight: '700',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: 'clamp(16px, 3vw, 26px)',
        textShadow: '0 1px 3px rgba(0,0,0,0.5)',
        lineHeight: '1',
        display: 'inline-block',
        transition: `transform ${FLASH_DURATION}ms ${ANIM_EASING}`,
    } as Partial<CSSStyleDeclaration>);
    num.textContent = '0';
    return num;
}

/**
 * DOM overlay showing P1 and P2 scores as a trapezoidal scoreboard
 * flush with the top of the screen. The shape is wider at the top and
 * tapers inward at the bottom with rounded bottom corners, a white
 * vertical divider, and a white border along the sides and bottom.
 * Score values are deferred during replay so the flash animation fires
 * after the HUD becomes visible.
 */
export function ScoreHudNode() {
    const gameState = useContext(GameCtx);
    const { renderer } = useThreeContext();
    const container = renderer.domElement.parentElement ?? document.body;
    const [replay] = useStore(ReplayStore);

    // Outer shell: white-filled trapezoid that acts as the border
    const border = document.createElement('div');
    Object.assign(border.style, {
        position: 'absolute',
        top: '0',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: '1000',
        pointerEvents: 'none',
        backgroundColor: '#ffffff',
        clipPath: trapezoidClip(TAPER_PX, CORNER_R),
        transition: `opacity 200ms ${ANIM_EASING}`,
        opacity: gameState.phase === 'intro' ? '0' : '1',
    } as Partial<CSSStyleDeclaration>);
    container.appendChild(border);

    // Inner container: slightly inset trapezoid holding the colored panels
    const el = document.createElement('div');
    Object.assign(el.style, {
        margin: `0 ${BORDER_PX}px ${BORDER_PX}px ${BORDER_PX}px`,
        display: 'flex',
        alignItems: 'stretch',
        clipPath: trapezoidClip(TAPER_PX, CORNER_R),
    } as Partial<CSSStyleDeclaration>);
    border.appendChild(el);

    // Use custom player colors when available (solo mode personality accent)
    const p1Color = gameState.playerColors?.[0] ?? SCORE_COLORS[0];
    const p2Color = gameState.playerColors?.[1] ?? SCORE_COLORS[1];

    // Left panel (P1)
    const p1Panel = document.createElement('div');
    Object.assign(p1Panel.style, {
        width: '64px',
        backgroundColor: p1Color,
        padding: '8px 0',
        textAlign: 'center',
    } as Partial<CSSStyleDeclaration>);

    // White vertical divider
    const divider = document.createElement('div');
    Object.assign(divider.style, {
        width: '2px',
        backgroundColor: '#ffffff',
        alignSelf: 'stretch',
    } as Partial<CSSStyleDeclaration>);

    // Right panel (P2)
    const p2Panel = document.createElement('div');
    Object.assign(p2Panel.style, {
        width: '64px',
        backgroundColor: p2Color,
        padding: '8px 0',
        textAlign: 'center',
    } as Partial<CSSStyleDeclaration>);

    const p1Num = createNum();
    const p2Num = createNum();
    p1Panel.appendChild(p1Num);
    p2Panel.appendChild(p2Num);

    el.appendChild(p1Panel);
    el.appendChild(divider);
    el.appendChild(p2Panel);

    /** Displayed scores — may lag behind gameState.scores during replay. */
    let shownP1 = -1;
    let shownP2 = -1;

    /** Tracks whether we were in replay last frame. */
    let wasInReplay = false;

    /** Timestamp after which we're allowed to sync scores (0 = immediate). */
    let scoreRevealTime = 0;

    /**
     * Flash a panel on score change. Uses forced reflow to guarantee the
     * bright state is painted before the transition back begins (a single
     * requestAnimationFrame inside the game loop's own rAF can batch both
     * style changes into one paint, making the flash invisible).
     *
     * @param panel - The panel element to flash.
     * @param num - The number span inside the panel to scale-pop.
     */
    function flashPanel(panel: HTMLElement, num: HTMLElement): void {
        // Instantly brighten the panel
        panel.style.transition = 'none';
        panel.style.filter = 'brightness(2.0)';

        // Scale-pop the number
        num.style.transition = 'none';
        num.style.transform = 'scale(1.35)';

        // Force reflow so the browser commits the bright/scaled state
        void panel.offsetHeight;

        // Transition back to normal
        panel.style.transition = `filter ${FLASH_DURATION}ms ${ANIM_EASING}`;
        panel.style.filter = 'brightness(1)';

        num.style.transition = `transform ${FLASH_DURATION}ms ${ANIM_EASING}`;
        num.style.transform = 'scale(1)';
    }

    useFrameUpdate(() => {
        const inReplay = gameState.phase === 'replay' && isReplayActive(replay);
        const hidden = gameState.phase === 'intro' || inReplay;
        border.style.opacity = hidden ? '0' : '1';

        // When exiting replay, defer score sync so the HUD fades in first
        if (wasInReplay && !inReplay) {
            scoreRevealTime = performance.now() + SCORE_REVEAL_DELAY;
        }
        wasInReplay = inReplay;

        // Only sync displayed scores when visible and past the reveal delay
        if (!inReplay && performance.now() >= scoreRevealTime) {
            const s0 = gameState.scores[0];
            const s1 = gameState.scores[1];

            if (s0 !== shownP1) {
                if (shownP1 !== -1) flashPanel(p1Panel, p1Num);
                shownP1 = s0;
                p1Num.textContent = String(s0);
            }
            if (s1 !== shownP2) {
                if (shownP2 !== -1) flashPanel(p2Panel, p2Num);
                shownP2 = s1;
                p2Num.textContent = String(s1);
            }
        }
    });

    useDestroy(() => {
        border.remove();
    });
}
