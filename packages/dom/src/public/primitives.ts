import { jsx } from '../jsx-runtime/index';
import type { PulseElement, PulseChild, ReactiveValue } from '../domain/types';

/**
 * Props shared by layout primitives.
 */
interface LayoutProps {
    /** Gap between children in pixels. */
    gap?: number;
    /** Center children along the main axis. */
    center?: boolean;
    /** Reactive visibility control. When false, sets `display: none`. */
    visible?: ReactiveValue<boolean>;
    /** Inline style overrides. */
    style?: Record<string, ReactiveValue<string>>;
    /** Child elements. */
    children?: PulseChild | PulseChild[];
}

/**
 * Root-level positioned container for overlays.
 *
 * Renders as an absolutely-positioned `div` covering the full parent,
 * with `pointer-events: none` so it does not block canvas interaction.
 * Child elements that need interaction should set `pointer-events: auto`.
 *
 * @param props - Overlay configuration.
 * @returns A {@link PulseElement} representing the overlay container.
 *
 * @example
 * ```tsx
 * import { useOverlay, Overlay } from '@pulse-ts/dom';
 *
 * function HudNode() {
 *     useOverlay(
 *         <Overlay>
 *             <span style={{ color: '#fff' }}>HUD Content</span>
 *         </Overlay>,
 *     );
 * }
 * ```
 */
export function Overlay(props: LayoutProps): PulseElement {
    const { gap, center, visible, style, children, ...rest } = props;
    const mergedStyle: Record<string, ReactiveValue<string>> = {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        ...(gap != null ? { gap: `${gap}px` } : {}),
        ...(center ? { alignItems: 'center', justifyContent: 'center' } : {}),
        ...style,
    };
    return jsx('div', { ...rest, visible, style: mergedStyle, children });
}

/**
 * Props for the {@link Row} component.
 */
interface RowProps extends LayoutProps {
    /** Justify content along the main axis (CSS `justify-content`). */
    justify?: string;
}

/**
 * Flex row layout primitive.
 *
 * Renders a `div` with `display: flex` and `flex-direction: row`.
 *
 * @param props - Row configuration.
 * @returns A {@link PulseElement} representing the flex row.
 *
 * @example
 * ```tsx
 * import { Row } from '@pulse-ts/dom';
 *
 * <Row gap={12} center>
 *     <span>Left</span>
 *     <span>Right</span>
 * </Row>
 * ```
 */
export function Row(props: RowProps): PulseElement {
    const { gap, center, justify, visible, style, children, ...rest } = props;
    const mergedStyle: Record<string, ReactiveValue<string>> = {
        display: 'flex',
        flexDirection: 'row',
        ...(gap != null ? { gap: `${gap}px` } : {}),
        ...(center ? { alignItems: 'center', justifyContent: 'center' } : {}),
        ...(justify ? { justifyContent: justify } : {}),
        ...style,
    };
    return jsx('div', { ...rest, visible, style: mergedStyle, children });
}

/**
 * Props for the {@link Column} component.
 */
interface ColumnProps extends LayoutProps {
    /** Align items along the cross axis (CSS `align-items`). */
    align?: string;
}

/**
 * Flex column layout primitive.
 *
 * Renders a `div` with `display: flex` and `flex-direction: column`.
 *
 * @param props - Column configuration.
 * @returns A {@link PulseElement} representing the flex column.
 *
 * @example
 * ```tsx
 * import { Column } from '@pulse-ts/dom';
 *
 * <Column gap={8} center>
 *     <span>Top</span>
 *     <span>Bottom</span>
 * </Column>
 * ```
 */
export function Column(props: ColumnProps): PulseElement {
    const { gap, center, align, visible, style, children, ...rest } = props;
    const mergedStyle: Record<string, ReactiveValue<string>> = {
        display: 'flex',
        flexDirection: 'column',
        ...(gap != null ? { gap: `${gap}px` } : {}),
        ...(center ? { alignItems: 'center', justifyContent: 'center' } : {}),
        ...(align ? { alignItems: align } : {}),
        ...style,
    };
    return jsx('div', { ...rest, visible, style: mergedStyle, children });
}

/**
 * Props for the {@link Button} component.
 */
interface ButtonProps {
    /** Click handler. */
    onClick?: (e: MouseEvent) => void;
    /** Accent color for hover/press feedback. */
    accent?: string;
    /** Reactive visibility control. */
    visible?: ReactiveValue<boolean>;
    /** Inline style overrides. */
    style?: Record<string, ReactiveValue<string>>;
    /** Button label or content. */
    children?: PulseChild | PulseChild[];
}

/**
 * Styled button primitive with built-in hover and press feedback.
 *
 * Renders a `<button>` element with default game-UI styling and
 * interactive feedback via CSS transitions. The `accent` prop
 * controls the highlight color on hover.
 *
 * @param props - Button configuration.
 * @returns A {@link PulseElement} representing the button.
 *
 * @example
 * ```tsx
 * import { Button } from '@pulse-ts/dom';
 *
 * <Button onClick={() => startGame()} accent="#48c9b0">
 *     Start Game
 * </Button>
 * ```
 */
export function Button(props: ButtonProps): PulseElement {
    const {
        onClick,
        accent = '#48c9b0',
        visible,
        style,
        children,
        ...rest
    } = props;

    const mergedStyle: Record<string, ReactiveValue<string>> = {
        padding: '8px 20px',
        border: 'none',
        borderRadius: '4px',
        backgroundColor: 'rgba(255,255,255,0.15)',
        color: '#fff',
        font: '14px monospace',
        cursor: 'pointer',
        pointerEvents: 'auto',
        transition: 'background-color 0.15s, transform 0.1s',
        ...style,
    };

    return jsx('button', {
        ...rest,
        visible,
        style: mergedStyle,
        onClick,
        onMouseenter: (e: MouseEvent) => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.backgroundColor = accent;
        },
        onMouseleave: (e: MouseEvent) => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.backgroundColor =
                (typeof style?.backgroundColor === 'function'
                    ? style.backgroundColor()
                    : style?.backgroundColor) ?? 'rgba(255,255,255,0.15)';
        },
        onMousedown: (e: MouseEvent) => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.transform = 'scale(0.96)';
        },
        onMouseup: (e: MouseEvent) => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.transform = '';
        },
        children,
    });
}
