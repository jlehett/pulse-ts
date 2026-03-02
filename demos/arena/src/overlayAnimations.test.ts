import {
    applyEntrance,
    applyStaggeredEntrance,
    applyScalePop,
    applyButtonHoverScale,
    ANIM_DURATION,
    ANIM_STAGGER,
    ANIM_EASING,
} from './overlayAnimations';

function createEl(): HTMLDivElement {
    return document.createElement('div');
}

// Mock requestAnimationFrame to execute callback synchronously
beforeEach(() => {
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
        cb(0);
        return 0;
    });
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe('applyEntrance', () => {
    it('sets final opacity to 1 and transform to translateY(0)', () => {
        const el = createEl();
        applyEntrance(el, 0);
        expect(el.style.opacity).toBe('1');
        expect(el.style.transform).toBe('translateY(0)');
    });

    it('includes delay and duration in transition', () => {
        const el = createEl();
        applyEntrance(el, 150);
        expect(el.style.transition).toContain(`${ANIM_DURATION}ms`);
        expect(el.style.transition).toContain('150ms');
        expect(el.style.transition).toContain(ANIM_EASING);
    });

    it('uses custom translateY offset', () => {
        const el = createEl();
        // Before rAF fires, the initial transform should be set
        jest.restoreAllMocks();
        jest.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 0);
        applyEntrance(el, 0, 40);
        expect(el.style.transform).toBe('translateY(40px)');
    });
});

describe('applyStaggeredEntrance', () => {
    it('applies entrance to each element with incremental delays', () => {
        const els = [createEl(), createEl(), createEl()];
        applyStaggeredEntrance(els, 200);

        // Each element should have its final animated state (rAF fires synchronously)
        els.forEach((el) => {
            expect(el.style.opacity).toBe('1');
        });

        // Check that delays are staggered
        expect(els[0].style.transition).toContain('200ms');
        expect(els[1].style.transition).toContain(`${200 + ANIM_STAGGER}ms`);
        expect(els[2].style.transition).toContain(
            `${200 + ANIM_STAGGER * 2}ms`,
        );
    });
});

describe('applyScalePop', () => {
    it('sets final transform with scale(1)', () => {
        const el = createEl();
        applyScalePop(el);
        expect(el.style.transform).toBe('translate(-50%, -50%) scale(1)');
        expect(el.style.opacity).toBe('1');
    });

    it('includes 250ms duration in transition', () => {
        const el = createEl();
        applyScalePop(el);
        expect(el.style.transition).toContain('250ms');
    });
});

describe('applyButtonHoverScale', () => {
    it('scales to 1.05 on pointerenter', () => {
        const btn = createEl();
        applyButtonHoverScale(btn);
        btn.dispatchEvent(new Event('pointerenter'));
        expect(btn.style.transform).toBe('scale(1.05)');
    });

    it('resets scale on pointerleave', () => {
        const btn = createEl();
        applyButtonHoverScale(btn);
        btn.dispatchEvent(new Event('pointerenter'));
        btn.dispatchEvent(new Event('pointerleave'));
        expect(btn.style.transform).toBe('scale(1)');
    });
});
