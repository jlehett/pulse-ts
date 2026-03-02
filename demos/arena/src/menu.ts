/** The mode selected by the user from the main menu. */
export type MenuChoice = 'local' | 'online';

/**
 * Display the main menu overlay and wait for the user to pick a mode.
 * Resolves with the chosen {@link MenuChoice}. The overlay removes itself
 * once a selection is made.
 *
 * @param container - The DOM element to mount the overlay into.
 * @returns A promise that resolves with `'local'` or `'online'`.
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
        const btnLocal = createButton('Local Play', '#48c9b0');
        const btnOnline = createButton('Online Play', '#e74c3c');
        const buttonRow = createButtonRow(btnLocal, btnOnline);

        overlay.appendChild(title);
        overlay.appendChild(subtitle);
        overlay.appendChild(buttonRow);
        container.appendChild(overlay);

        // Fade in on next frame
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
        });

        function pick(choice: MenuChoice) {
            overlay.style.opacity = '0';
            overlay.addEventListener('transitionend', () => {
                overlay.remove();
                resolve(choice);
            });
        }

        btnLocal.addEventListener('click', () => pick('local'));
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
        backgroundColor: 'rgba(10, 10, 26, 0.92)',
        opacity: '0',
        transition: 'opacity 0.4s ease-in-out',
    } as Partial<CSSStyleDeclaration>);
    return el;
}

function createTitle(): HTMLDivElement {
    const el = document.createElement('div');
    el.textContent = 'BUMPER BALLS';
    Object.assign(el.style, {
        font: 'bold clamp(28px, 8vw, 48px) monospace',
        color: '#fff',
        textShadow: '0 0 20px rgba(72, 201, 176, 0.6)',
        letterSpacing: 'clamp(1px, 0.5vw, 4px)',
    } as Partial<CSSStyleDeclaration>);
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
    Object.assign(btn.style, {
        font: 'bold clamp(14px, 3.5vw, 18px) monospace',
        color: '#fff',
        backgroundColor: 'rgba(255,255,255,0.08)',
        border: '2px solid rgba(255,255,255,0.2)',
        borderRadius: '6px',
        padding: '12px 32px',
        cursor: 'pointer',
        minWidth: 'min(200px, 70vw)',
        minHeight: '44px',
        transition: 'all 0.2s ease',
    } as Partial<CSSStyleDeclaration>);

    btn.addEventListener('pointerdown', () => {
        btn.style.backgroundColor = 'rgba(255,255,255,0.15)';
        btn.style.borderColor = color;
        btn.style.boxShadow = `0 0 12px ${color}44`;
    });
    btn.addEventListener('pointerup', () => {
        btn.style.backgroundColor = 'rgba(255,255,255,0.08)';
        btn.style.borderColor = 'rgba(255,255,255,0.2)';
        btn.style.boxShadow = 'none';
    });
    btn.addEventListener('pointerleave', () => {
        btn.style.backgroundColor = 'rgba(255,255,255,0.08)';
        btn.style.borderColor = 'rgba(255,255,255,0.2)';
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
