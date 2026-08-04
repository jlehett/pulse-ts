/**
 * Tiny raw-DOM helpers for Overclock's standalone screens (menu, map,
 * events...). These screens are static promise-based overlays with heavy
 * SVG use, so they're built directly against the DOM rather than the
 * reactive @pulse-ts/dom JSX layer (which the in-battle HUD uses).
 */

import { UI_SCALE } from '../config/theme';

/**
 * Creates an element with inline CSS text and optional inner HTML.
 *
 * All markup passed through `html` is authored in this codebase (icons,
 * design chrome) — never user input.
 */
export function el<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    css: string,
    html?: string,
): HTMLElementTagNameMap[K] {
    const node = document.createElement(tag);
    node.style.cssText = css;
    if (html !== undefined) node.innerHTML = html;
    return node;
}

/** Shorthand for the most common case. */
export function div(css: string, html?: string): HTMLDivElement {
    return el('div', css, html);
}

let keyframesInjected = false;

/**
 * Injects the shared @keyframes used across screens (once per page).
 */
export function ensureKeyframes(): void {
    if (keyframesInjected) return;
    keyframesInjected = true;
    const style = document.createElement('style');
    style.textContent = `
@keyframes ovcSpin { to { transform: rotate(360deg); } }
@keyframes ovcSpinRev { to { transform: rotate(-360deg); } }
@keyframes ovcCorePulse { 0%,100% { opacity:.5; transform:scale(1); } 50% { opacity:.9; transform:scale(1.06); } }
@keyframes ovcTitleGlow { 0%,100% { filter:drop-shadow(0 0 22px rgba(56,232,255,.35)); } 50% { filter:drop-shadow(0 0 34px rgba(56,232,255,.6)); } }
@keyframes ovcFloatUp { 0% { transform:translateY(0); opacity:0; } 12% { opacity:.7; } 100% { transform:translateY(-70px); opacity:0; } }
@keyframes ovcPulseSoft { 0%,100% { opacity:.55; } 50% { opacity:1; } }
@keyframes ovcDashFlow { to { stroke-dashoffset: -22; } }
@keyframes ovcFadeIn { from { opacity:0; } to { opacity:1; } }
@keyframes ovcSlideUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
`;
    document.head.appendChild(style);
}

/**
 * Mounts a full-screen overlay root and returns it with a disposer.
 *
 * @param container - Parent element (usually document.body).
 * @param css - Additional CSS for the root (backgrounds etc.).
 */
export function mountScreen(
    container: HTMLElement,
    css: string,
): { root: HTMLDivElement; dispose: () => void } {
    ensureKeyframes();
    const root = div(
        `position:fixed;inset:0;overflow:hidden;z-index:5000;user-select:none;-webkit-user-select:none;zoom:${UI_SCALE};` +
            `font-family:'Rajdhani',system-ui,sans-serif;animation:ovcFadeIn .25s ease;${css}`,
    );
    container.appendChild(root);
    return {
        root,
        dispose: () => {
            root.remove();
        },
    };
}

/**
 * Attaches hover styles by toggling CSS text fragments.
 *
 * @param node - Target element.
 * @param hoverCss - Style properties applied while hovered.
 */
export function hover(
    node: HTMLElement,
    hoverCss: Partial<CSSStyleDeclaration>,
): void {
    const original = new Map<string, string>();
    node.addEventListener('mouseenter', () => {
        for (const key of Object.keys(hoverCss)) {
            original.set(key, node.style[key as never]);
            node.style[key as never] = hoverCss[key as never] as never;
        }
    });
    node.addEventListener('mouseleave', () => {
        for (const [key, value] of original) {
            node.style[key as never] = value as never;
        }
        original.clear();
    });
}
