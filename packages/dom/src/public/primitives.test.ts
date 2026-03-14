import { createElement } from '../domain/createElement';
import { Overlay, Row, Column, Button } from './primitives';

describe('primitives', () => {
    describe('Overlay', () => {
        it('renders an absolutely-positioned div', () => {
            const el = Overlay({});
            const { root } = createElement(el);
            const div = root as HTMLElement;
            expect(div.style.position).toBe('absolute');
            expect(div.style.top).toBe('0px');
            expect(div.style.left).toBe('0px');
            expect(div.style.width).toBe('100%');
            expect(div.style.height).toBe('100%');
            expect(div.style.pointerEvents).toBe('none');
        });

        it('applies gap when provided', () => {
            const el = Overlay({ gap: 16 });
            const { root } = createElement(el);
            expect((root as HTMLElement).style.gap).toBe('16px');
        });

        it('centers content when center is true', () => {
            const el = Overlay({ center: true });
            const { root } = createElement(el);
            const div = root as HTMLElement;
            expect(div.style.alignItems).toBe('center');
            expect(div.style.justifyContent).toBe('center');
        });
    });

    describe('Row', () => {
        it('renders a flex row', () => {
            const el = Row({});
            const { root } = createElement(el);
            const div = root as HTMLElement;
            expect(div.style.display).toBe('flex');
            expect(div.style.flexDirection).toBe('row');
        });

        it('applies justify prop', () => {
            const el = Row({ justify: 'space-between' });
            const { root } = createElement(el);
            expect((root as HTMLElement).style.justifyContent).toBe(
                'space-between',
            );
        });

        it('applies gap', () => {
            const el = Row({ gap: 8 });
            const { root } = createElement(el);
            expect((root as HTMLElement).style.gap).toBe('8px');
        });
    });

    describe('Column', () => {
        it('renders a flex column', () => {
            const el = Column({});
            const { root } = createElement(el);
            const div = root as HTMLElement;
            expect(div.style.display).toBe('flex');
            expect(div.style.flexDirection).toBe('column');
        });

        it('applies align prop', () => {
            const el = Column({ align: 'flex-start' });
            const { root } = createElement(el);
            expect((root as HTMLElement).style.alignItems).toBe('flex-start');
        });

        it('centers content when center is true', () => {
            const el = Column({ center: true });
            const { root } = createElement(el);
            const div = root as HTMLElement;
            expect(div.style.alignItems).toBe('center');
            expect(div.style.justifyContent).toBe('center');
        });
    });

    describe('Button', () => {
        it('renders a button element', () => {
            const el = Button({ children: 'Click me' });
            const { root } = createElement(el);
            expect(root.tagName).toBe('BUTTON');
            expect((root as HTMLElement).textContent).toBe('Click me');
        });

        it('registers click handler', () => {
            const handler = jest.fn();
            const el = Button({ onClick: handler, children: 'btn' });
            const { root } = createElement(el);
            (root as HTMLElement).click();
            expect(handler).toHaveBeenCalledTimes(1);
        });

        it('applies default styling', () => {
            const el = Button({ children: 'btn' });
            const { root } = createElement(el);
            const btn = root as HTMLElement;
            expect(btn.style.cursor).toBe('pointer');
            expect(btn.style.pointerEvents).toBe('auto');
        });

        it('applies hover feedback on mouseenter/mouseleave', () => {
            const el = Button({ accent: '#ff0000', children: 'btn' });
            const { root } = createElement(el);
            const btn = root as HTMLElement;

            btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
            // jsdom normalizes hex colors to rgb
            expect(btn.style.backgroundColor).toBe('rgb(255, 0, 0)');

            btn.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
            expect(btn.style.backgroundColor).toBe('rgba(255, 255, 255, 0.15)');
        });

        it('applies press feedback on mousedown/mouseup', () => {
            const el = Button({ children: 'btn' });
            const { root } = createElement(el);
            const btn = root as HTMLElement;

            btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            expect(btn.style.transform).toBe('scale(0.96)');

            btn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
            expect(btn.style.transform).toBe('');
        });
    });
});
