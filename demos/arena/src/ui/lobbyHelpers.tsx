import { createElement, Column, Row, Button } from '@pulse-ts/dom';

/**
 * Create a full-screen semi-transparent overlay container for lobby screens.
 *
 * @returns A positioned overlay `div` with opacity transition support.
 *
 * @example
 * ```ts
 * const overlay = createOverlay();
 * document.body.appendChild(overlay);
 * ```
 */
export function createOverlay(): HTMLDivElement {
    const { root } = createElement(
        <div
            style={{
                position: 'absolute',
                inset: '0',
                zIndex: '5000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(10, 10, 26, 0.65)',
                opacity: '0',
                transition: 'opacity 0.4s ease-in-out',
            }}
        />,
    );
    return root as HTMLDivElement;
}

/**
 * Clear the overlay and create a centered content column.
 *
 * @param overlay - The overlay element to clear and populate.
 * @returns The content container div.
 *
 * @example
 * ```ts
 * const content = clearAndCreateContent(overlay);
 * content.appendChild(heading);
 * ```
 */
export function clearAndCreateContent(overlay: HTMLElement): HTMLDivElement {
    overlay.innerHTML = '';
    const { root } = createElement(
        <Column
            gap={16}
            style={{
                alignItems: 'center',
                padding: '0 20px',
            }}
        />,
    );
    const content = root as HTMLDivElement;
    overlay.appendChild(content);
    return content;
}

/**
 * Create a large heading element for lobby screens.
 *
 * @param text - The heading text to display.
 * @returns A styled heading div.
 *
 * @example
 * ```ts
 * const heading = createHeading('HOST GAME');
 * ```
 */
export function createHeading(text: string): HTMLDivElement {
    const { root } = createElement(
        <div
            style={{
                font: 'bold clamp(22px, 6vw, 32px) monospace',
                color: '#fff',
                textShadow: '0 0 16px rgba(72, 201, 176, 0.5)',
                letterSpacing: '3px',
                marginBottom: '8px',
            }}
        >
            {text}
        </div>,
    );
    return root as HTMLDivElement;
}

/**
 * Create a smaller subheading element for lobby screens.
 *
 * @param text - The subheading text to display.
 * @returns A styled subheading div.
 *
 * @example
 * ```ts
 * const sub = createSubheading('Choose your player');
 * ```
 */
export function createSubheading(text: string): HTMLDivElement {
    const { root } = createElement(
        <div
            style={{
                font: '14px monospace',
                color: '#888',
                letterSpacing: '2px',
                textTransform: 'uppercase',
            }}
        >
            {text}
        </div>,
    );
    return root as HTMLDivElement;
}

/**
 * Create a styled button element for lobby screens.
 *
 * @param label - Button label text.
 * @param color - Accent color for the button.
 * @returns A styled button element.
 *
 * @example
 * ```ts
 * const btn = createBtn('Host Game', '#48c9b0');
 * ```
 */
export function createBtn(label: string, color: string): HTMLButtonElement {
    const { root } = createElement(
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
    return root as HTMLButtonElement;
}

/**
 * Create a vertical column layout containing the given children.
 *
 * @param children - Elements to arrange vertically.
 * @returns A column div containing the children.
 *
 * @example
 * ```ts
 * const col = createColumnEl(btn1, btn2);
 * ```
 */
export function createColumnEl(...children: HTMLElement[]): HTMLDivElement {
    const { root } = createElement(
        <Column gap={12} style={{ alignItems: 'center' }} />,
    );
    const col = root as HTMLDivElement;
    children.forEach((c) => col.appendChild(c));
    return col;
}

/**
 * Create a horizontal row layout containing the given children.
 *
 * @param children - Elements to arrange horizontally.
 * @returns A row div containing the children.
 *
 * @example
 * ```ts
 * const row = createRowEl(btnP1, btnP2);
 * ```
 */
export function createRowEl(...children: HTMLElement[]): HTMLDivElement {
    const { root } = createElement(
        <Row gap={12} center style={{ flexWrap: 'wrap' }} />,
    );
    const row = root as HTMLDivElement;
    children.forEach((c) => row.appendChild(c));
    return row;
}

/** Status indicator element with a setter for status text and color. */
export interface StatusIndicator {
    el: HTMLDivElement;
    set: (
        state: 'idle' | 'connecting' | 'connected' | 'error',
        msg?: string,
    ) => void;
}

const STATUS_COLORS: Record<string, string> = {
    idle: '#888',
    connecting: '#f1c40f',
    connected: '#48c9b0',
    error: '#e74c3c',
};

/**
 * Create a status indicator element that displays colored status messages.
 *
 * @returns A {@link StatusIndicator} with an element and a `set` method.
 *
 * @example
 * ```ts
 * const status = createStatusIndicator();
 * status.set('connecting', 'Connecting...');
 * ```
 */
export function createStatusIndicator(): StatusIndicator {
    const { root } = createElement(
        <div
            style={{
                font: '13px monospace',
                color: '#888',
                minHeight: '20px',
                textAlign: 'center',
            }}
        />,
    );
    const el = root as HTMLDivElement;

    return {
        el,
        set(state, msg) {
            el.style.color = STATUS_COLORS[state] ?? '#888';
            el.textContent = msg ?? '';
        },
    };
}
