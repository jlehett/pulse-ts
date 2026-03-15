import { useFrameUpdate, useContext, useStore } from '@pulse-ts/core';
import { useThreeContext } from '@pulse-ts/three';
import { useOverlay, Row } from '@pulse-ts/dom';
import { useAnimate } from '@pulse-ts/effects';
import { GameCtx } from '../contexts';
import { ReplayStore } from '../replay';
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

    // Use custom player colors when available (solo mode personality accent)
    const p1Color = gameState.playerConfig?.colors[0] ?? SCORE_COLORS[0];
    const p2Color = gameState.playerConfig?.colors[1] ?? SCORE_COLORS[1];

    const root = useOverlay(
        <div
            style={{
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
            }}
        >
            <Row
                style={{
                    margin: `0 ${BORDER_PX}px ${BORDER_PX}px ${BORDER_PX}px`,
                    alignItems: 'stretch',
                    clipPath: trapezoidClip(TAPER_PX, CORNER_R),
                }}
            >
                <div
                    style={{
                        width: '64px',
                        backgroundColor: p1Color,
                        padding: '8px 0',
                        textAlign: 'center',
                    }}
                >
                    <span
                        style={{
                            color: '#ffffff',
                            fontWeight: '700',
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                            fontSize: 'clamp(16px, 3vw, 26px)',
                            textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                            lineHeight: '1',
                            display: 'inline-block',
                            transition: `transform ${FLASH_DURATION}ms ${ANIM_EASING}`,
                        }}
                    >
                        {() => String(gameState.scores[0])}
                    </span>
                </div>
                <div
                    style={{
                        width: '2px',
                        backgroundColor: '#ffffff',
                        alignSelf: 'stretch',
                    }}
                />
                <div
                    style={{
                        width: '64px',
                        backgroundColor: p2Color,
                        padding: '8px 0',
                        textAlign: 'center',
                    }}
                >
                    <span
                        style={{
                            color: '#ffffff',
                            fontWeight: '700',
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                            fontSize: 'clamp(16px, 3vw, 26px)',
                            textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                            lineHeight: '1',
                            display: 'inline-block',
                            transition: `transform ${FLASH_DURATION}ms ${ANIM_EASING}`,
                        }}
                    >
                        {() => String(gameState.scores[1])}
                    </span>
                </div>
            </Row>
        </div>,
        container,
    );

    const border = root as HTMLElement;
    const inner = border.children[0] as HTMLElement;
    const p1Panel = inner.children[0] as HTMLElement;
    const p2Panel = inner.children[2] as HTMLElement;
    const p1Num = p1Panel.children[0] as HTMLElement;
    const p2Num = p2Panel.children[0] as HTMLElement;

    /** Displayed scores --- may lag behind gameState.scores during replay. */
    let shownP1 = -1;
    let shownP2 = -1;

    // Fire-and-forget flash animations using play(onUpdate)
    const panelFlash = useAnimate({
        from: 2.0,
        to: 1.0,
        duration: FLASH_DURATION / 1000,
        easing: 'ease-out',
    });
    const numPop = useAnimate({
        from: 1.35,
        to: 1.0,
        duration: FLASH_DURATION / 1000,
        easing: 'ease-out',
    });

    /** Tracks whether we were in replay last frame. */
    let wasInReplay = false;

    /** Timestamp after which we're allowed to sync scores (0 = immediate). */
    let scoreRevealTime = 0;

    /**
     * Flash a panel on score change using fire-and-forget `play(onUpdate)`.
     *
     * @param panel - The panel element to flash.
     * @param num - The number span inside the panel to scale-pop.
     */
    function flashPanel(panel: HTMLElement, num: HTMLElement): void {
        panelFlash.play((v) => {
            panel.style.filter = `brightness(${v})`;
        });
        numPop.play((v) => {
            num.style.transform = `scale(${v})`;
        });
    }

    useFrameUpdate(() => {
        const inReplay = gameState.phase === 'replay' && replay.active;
        const hidden = gameState.phase === 'intro' || inReplay;
        border.style.opacity = hidden ? '0' : '1';

        if (wasInReplay && !inReplay) {
            scoreRevealTime = performance.now() + SCORE_REVEAL_DELAY;
        }
        wasInReplay = inReplay;

        if (!inReplay && performance.now() >= scoreRevealTime) {
            const s0 = gameState.scores[0];
            const s1 = gameState.scores[1];

            if (s0 !== shownP1) {
                if (shownP1 !== -1) flashPanel(p1Panel, p1Num);
                shownP1 = s0;
            }
            if (s1 !== shownP2) {
                if (shownP2 !== -1) flashPanel(p2Panel, p2Num);
                shownP2 = s1;
            }
        }
    });
}
