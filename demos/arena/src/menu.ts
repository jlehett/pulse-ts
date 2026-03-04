import {
    applyStaggeredEntrance,
    applyButtonHoverScale,
} from './overlayAnimations';
import { isMobileDevice } from './isMobileDevice';

/** The mode selected by the user from the main menu. */
export type MenuChoice = 'local' | 'online' | 'solo';

/**
 * Display the main menu overlay and wait for the user to pick a mode.
 * Resolves with the chosen {@link MenuChoice}. The overlay removes itself
 * once a selection is made.
 *
 * @param container - The DOM element to mount the overlay into.
 * @returns A promise that resolves with `'local'`, `'online'`, or `'solo'`.
 *
 * @example
 * ```ts
 * const choice = await showMainMenu(document.body);
 * if (choice === 'local') startLocalGame();
 * ```
 */
export function showMainMenu(container: HTMLElement): Promise<MenuChoice> {
    return new Promise((resolve) => {
        const overlay = createOverlay();
        const title = createTitle();
        const subtitle = createSubtitle();
        const mobile = isMobileDevice();
        const btnSolo = createButton('Solo Play', '#f1c40f');
        const btnLocal = mobile ? null : createButton('Local Play', '#48c9b0');
        const btnOnline = createButton('Online Play', '#e74c3c');
        const rowButtons: HTMLElement[] = [btnSolo];
        if (btnLocal) rowButtons.push(btnLocal);
        rowButtons.push(btnOnline);
        const buttonRow = createButtonRow(...rowButtons);

        // Inject title bump keyframes
        const style = injectTitleBumpStyle();

        overlay.appendChild(title);
        overlay.appendChild(subtitle);
        overlay.appendChild(buttonRow);
        container.appendChild(overlay);

        // Fade in on next frame, then stagger content
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
        });
        applyStaggeredEntrance([title, subtitle, buttonRow], 200);
        applyButtonHoverScale(btnSolo);
        if (btnLocal) applyButtonHoverScale(btnLocal);
        applyButtonHoverScale(btnOnline);

        function pick(choice: MenuChoice) {
            overlay.style.opacity = '0';
            overlay.addEventListener('transitionend', () => {
                overlay.remove();
                style.remove();
                resolve(choice);
            });
        }

        btnSolo.addEventListener('click', () => pick('solo'));
        if (btnLocal) btnLocal.addEventListener('click', () => pick('local'));
        btnOnline.addEventListener('click', () => pick('online'));
    });
}

function createOverlay(): HTMLDivElement {
    const el = document.createElement('div');
    Object.assign(el.style, {
        position: 'absolute',
        inset: '0',
        zIndex: '5000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        padding: '0 20px',
        backgroundColor: 'rgba(10, 10, 26, 0.65)',
        opacity: '0',
        transition: 'opacity 0.4s ease-in-out',
    } as Partial<CSSStyleDeclaration>);
    return el;
}

function createTitle(): HTMLDivElement {
    const el = document.createElement('div');
    Object.assign(el.style, {
        font: 'bold clamp(28px, 8vw, 48px) monospace',
        color: '#fff',
        textShadow: '0 0 20px rgba(72, 201, 176, 0.6)',
        letterSpacing: 'clamp(1px, 0.5vw, 4px)',
    } as Partial<CSSStyleDeclaration>);

    const bumper = document.createElement('span');
    bumper.textContent = 'BUMPER';
    Object.assign(bumper.style, {
        display: 'inline-block',
        animation: 'bumpLeft 2.5s ease-out infinite',
    } as Partial<CSSStyleDeclaration>);

    const balls = document.createElement('span');
    balls.textContent = ' BALLS';
    Object.assign(balls.style, {
        display: 'inline-block',
        animation: 'bumpRight 2.5s ease-out infinite',
    } as Partial<CSSStyleDeclaration>);

    el.appendChild(bumper);
    el.appendChild(balls);
    return el;
}

function createSubtitle(): HTMLDivElement {
    const el = document.createElement('div');
    el.textContent = 'ARENA';
    Object.assign(el.style, {
        font: 'bold clamp(16px, 4vw, 24px) monospace',
        color: '#888',
        letterSpacing: 'clamp(2px, 1vw, 8px)',
        marginBottom: '32px',
    } as Partial<CSSStyleDeclaration>);
    return el;
}

/**
 * Create a styled menu button.
 *
 * @param label - The button text.
 * @param color - Accent color for hover/focus glow.
 * @returns The button element.
 */
function createButton(label: string, color: string): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = label;

    const defaultBg =
        'linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))';
    const defaultBorder = 'rgba(255,255,255,0.2)';

    Object.assign(btn.style, {
        font: 'bold clamp(14px, 3.5vw, 18px) monospace',
        color: '#fff',
        background: defaultBg,
        border: `2px solid ${defaultBorder}`,
        borderRadius: '6px',
        padding: '12px 32px',
        cursor: 'pointer',
        minWidth: 'min(200px, 70vw)',
        minHeight: '44px',
        transition: 'all 0.2s ease',
    } as Partial<CSSStyleDeclaration>);

    btn.addEventListener('pointerenter', () => {
        btn.style.borderColor = color;
        btn.style.boxShadow = `0 0 15px ${color}44, inset 0 0 8px ${color}22`;
    });
    btn.addEventListener('pointerdown', () => {
        btn.style.background =
            'linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.08))';
        btn.style.borderColor = color;
        btn.style.boxShadow = `0 0 20px ${color}66, inset 0 0 12px ${color}33`;
    });
    btn.addEventListener('pointerup', () => {
        btn.style.background = defaultBg;
        btn.style.borderColor = color;
        btn.style.boxShadow = `0 0 15px ${color}44, inset 0 0 8px ${color}22`;
    });
    btn.addEventListener('pointerleave', () => {
        btn.style.background = defaultBg;
        btn.style.borderColor = defaultBorder;
        btn.style.boxShadow = 'none';
    });

    return btn;
}

function createButtonRow(...buttons: HTMLElement[]): HTMLDivElement {
    const row = document.createElement('div');
    Object.assign(row.style, {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        alignItems: 'center',
    } as Partial<CSSStyleDeclaration>);
    buttons.forEach((b) => row.appendChild(b));
    return row;
}

function injectTitleBumpStyle(): HTMLStyleElement {
    const style = document.createElement('style');
    style.textContent = `
@keyframes bumpLeft {
  0%       { transform: translateX(-16px) rotate(0deg); text-shadow: 0 0 20px rgba(72,201,176,0.6); }
  4%       { transform: translateX(-16px) rotate(0deg); text-shadow: 0 0 20px rgba(72,201,176,0.6); }
  8%       { transform: translateX(4px) scaleX(0.88) scaleY(1.06) rotate(0deg); text-shadow: 0 0 60px rgba(72,201,176,1), 0 0 120px rgba(72,201,176,0.5), 0 0 200px rgba(72,201,176,0.2); }
  12%      { transform: translateX(-30px) rotate(-3deg); text-shadow: 0 0 30px rgba(72,201,176,0.7); }
  16%      { transform: translateX(-30px) rotate(0deg); }
  28%      { transform: translateX(-30px) rotate(0deg); }
  40%      { transform: translateX(-16px) rotate(0deg); text-shadow: 0 0 20px rgba(72,201,176,0.6); }
  100%     { transform: translateX(-16px) rotate(0deg); text-shadow: 0 0 20px rgba(72,201,176,0.6); }
}
@keyframes bumpRight {
  0%       { transform: translateX(16px) rotate(0deg); text-shadow: 0 0 20px rgba(72,201,176,0.6); }
  4%       { transform: translateX(16px) rotate(0deg); text-shadow: 0 0 20px rgba(72,201,176,0.6); }
  8%       { transform: translateX(-4px) scaleX(0.88) scaleY(1.06) rotate(0deg); text-shadow: 0 0 60px rgba(72,201,176,1), 0 0 120px rgba(72,201,176,0.5), 0 0 200px rgba(72,201,176,0.2); }
  12%      { transform: translateX(30px) rotate(3deg); text-shadow: 0 0 30px rgba(72,201,176,0.7); }
  16%      { transform: translateX(30px) rotate(0deg); }
  25%      { transform: translateX(30px) rotate(0deg); }
  37%      { transform: translateX(16px) rotate(0deg); text-shadow: 0 0 20px rgba(72,201,176,0.6); }
  100%     { transform: translateX(16px) rotate(0deg); text-shadow: 0 0 20px rgba(72,201,176,0.6); }
}`;
    document.head.appendChild(style);
    return style;
}
