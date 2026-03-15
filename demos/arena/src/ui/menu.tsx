import { createElement, Column, Button } from '@pulse-ts/dom';
import {
    applyStaggeredEntrance,
    applyButtonHoverScale,
} from './overlayAnimations';
import { isMobile } from '@pulse-ts/platform';

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
        const mobile = isMobile();

        // Inject title bump keyframes
        const styleEl = injectTitleBumpStyle();

        const soloBtn: HTMLButtonElement[] = [];
        const localBtn: HTMLButtonElement[] = [];
        const onlineBtn: HTMLButtonElement[] = [];

        const { root } = createElement(
            <div
                style={{
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
                }}
            >
                <div
                    style={{
                        font: 'bold clamp(28px, 8vw, 48px) monospace',
                        color: '#fff',
                        textShadow: '0 0 20px rgba(72, 201, 176, 0.6)',
                        letterSpacing: 'clamp(1px, 0.5vw, 4px)',
                    }}
                >
                    <span
                        style={{
                            display: 'inline-block',
                            animation: 'bumpLeft 2.5s ease-out infinite',
                        }}
                    >
                        BUMPER
                    </span>
                    <span
                        style={{
                            display: 'inline-block',
                            animation: 'bumpRight 2.5s ease-out infinite',
                        }}
                    >
                        {' BALLS'}
                    </span>
                </div>
                <div
                    style={{
                        font: 'bold clamp(16px, 4vw, 24px) monospace',
                        color: '#888',
                        letterSpacing: 'clamp(2px, 1vw, 8px)',
                        marginBottom: '32px',
                    }}
                >
                    ARENA
                </div>
                <Column gap={12} style={{ alignItems: 'center' }} />
            </div>,
        );

        const overlay = root as HTMLElement;
        const title = overlay.children[0] as HTMLElement;
        const subtitle = overlay.children[1] as HTMLElement;
        const buttonRow = overlay.children[2] as HTMLElement;

        function createMenuButton(
            label: string,
            color: string,
        ): HTMLButtonElement {
            const { root: btnRoot } = createElement(
                <Button
                    accent={color}
                    style={{
                        font: 'bold clamp(14px, 3.5vw, 18px) monospace',
                        border: '2px solid rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        padding: '12px 32px',
                        minWidth: 'min(200px, 70vw)',
                        minHeight: '44px',
                    }}
                >
                    {label}
                </Button>,
            );
            return btnRoot as HTMLButtonElement;
        }

        const btnSolo = createMenuButton('Solo Play', '#f1c40f');
        soloBtn.push(btnSolo);
        buttonRow.appendChild(btnSolo);

        if (!mobile) {
            const btnLocal = createMenuButton('Local Play', '#48c9b0');
            localBtn.push(btnLocal);
            buttonRow.appendChild(btnLocal);
        }

        const btnOnline = createMenuButton('Online Play', '#e74c3c');
        onlineBtn.push(btnOnline);
        buttonRow.appendChild(btnOnline);

        container.appendChild(overlay);

        // Fade in on next frame, then stagger content
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
        });
        applyStaggeredEntrance([title, subtitle, buttonRow], 200);
        applyButtonHoverScale(btnSolo);
        if (localBtn[0]) applyButtonHoverScale(localBtn[0]);
        applyButtonHoverScale(btnOnline);

        function pick(choice: MenuChoice) {
            overlay.style.opacity = '0';
            overlay.addEventListener('transitionend', () => {
                overlay.remove();
                styleEl.remove();
                resolve(choice);
            });
        }

        btnSolo.addEventListener('click', () => pick('solo'));
        if (localBtn[0])
            localBtn[0].addEventListener('click', () => pick('local'));
        btnOnline.addEventListener('click', () => pick('online'));
    });
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
