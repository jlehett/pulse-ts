/** Default animation duration in ms. */
export const ANIM_DURATION = 400;

/** Delay between staggered elements in ms. */
export const ANIM_STAGGER = 80;

/** Easing curve — exponential ease-out. */
export const ANIM_EASING = 'cubic-bezier(0.16, 1, 0.3, 1)';

/**
 * Animate an element in with a slide-up + fade entrance.
 *
 * @param el - The element to animate.
 * @param delay - Delay before the animation starts (ms).
 * @param translateY - Starting Y offset in pixels. @default 20
 *
 * @example
 * ```ts
 * applyEntrance(titleEl, 0);
 * applyEntrance(subtitleEl, 80);
 * ```
 */
export function applyEntrance(
    el: HTMLElement,
    delay: number,
    translateY: number = 20,
): void {
    // Preserve any existing transform (e.g. centering translate(-50%, -50%))
    const base = el.style.transform || '';
    el.style.opacity = '0';
    el.style.transform = `${base} translateY(${translateY}px)`.trim();
    el.style.transition = 'none';

    requestAnimationFrame(() => {
        el.style.transition = `opacity ${ANIM_DURATION}ms ${ANIM_EASING} ${delay}ms, transform ${ANIM_DURATION}ms ${ANIM_EASING} ${delay}ms`;
        el.style.opacity = '1';
        el.style.transform = base || 'translateY(0)';
    });
}

/**
 * Apply staggered entrance animations to a list of elements.
 * Each element slides up and fades in with an incremental delay.
 *
 * @param elements - Elements to animate in order.
 * @param baseDelay - Delay before the first element starts (ms). @default 200
 *
 * @example
 * ```ts
 * applyStaggeredEntrance([title, subtitle, buttonRow], 200);
 * ```
 */
export function applyStaggeredEntrance(
    elements: HTMLElement[],
    baseDelay: number = 200,
): void {
    elements.forEach((el, i) => {
        applyEntrance(el, baseDelay + i * ANIM_STAGGER);
    });
}

/**
 * Apply a scale-pop effect — element scales from 1.5 down to 1.0 with a
 * quick fade-in. Ideal for countdown numbers and score changes.
 *
 * @param el - The element to animate.
 *
 * @example
 * ```ts
 * applyScalePop(countdownEl);
 * ```
 */
export function applyScalePop(el: HTMLElement): void {
    el.style.transition = 'none';
    el.style.transform = 'translate(-50%, -50%) scale(1.5)';
    el.style.opacity = '0.5';

    requestAnimationFrame(() => {
        el.style.transition = `transform 250ms ${ANIM_EASING}, opacity 250ms ${ANIM_EASING}`;
        el.style.transform = 'translate(-50%, -50%) scale(1)';
        el.style.opacity = '1';
    });
}

/**
 * Add hover-scale feedback to a button. Scales to 1.05 on pointer enter,
 * back to 1.0 on pointer leave.
 *
 * @param btn - The button element.
 *
 * @example
 * ```ts
 * applyButtonHoverScale(startBtn);
 * ```
 */
export function applyButtonHoverScale(btn: HTMLElement): void {
    // Skip hover scaling on touch-only devices where pointerenter fires
    // on tap but pointerleave doesn't reliably clear, causing sticky hover.
    if (
        typeof window.matchMedia === 'function' &&
        !window.matchMedia('(hover: hover)').matches
    ) {
        return;
    }
    const base = btn.style.transform || '';
    btn.addEventListener('pointerenter', () => {
        btn.style.transform = `${base} scale(1.05)`.trim();
    });
    btn.addEventListener('pointerleave', () => {
        btn.style.transform = base || 'scale(1)';
    });
}
