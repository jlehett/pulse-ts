import { jsx, jsxs, Fragment } from './index';

describe('jsx runtime', () => {
    describe('jsx', () => {
        it('creates a PulseElement for an intrinsic tag', () => {
            const el = jsx('div', { id: 'test', children: 'hello' });
            expect(el.type).toBe('div');
            expect(el.props).toEqual({ id: 'test' });
            expect(el.children).toEqual(['hello']);
        });

        it('handles no children', () => {
            const el = jsx('br', {});
            expect(el.children).toEqual([]);
        });

        it('handles a single child element', () => {
            const child = jsx('span', { children: 'inner' });
            const el = jsx('div', { children: child });
            expect(el.children).toHaveLength(1);
            expect(el.children[0]).toBe(child);
        });

        it('separates children from other props', () => {
            const el = jsx('div', {
                id: 'x',
                className: 'y',
                children: 'text',
            });
            expect(el.props).toEqual({ id: 'x', className: 'y' });
            expect(el.children).toEqual(['text']);
        });
    });

    describe('jsxs', () => {
        it('handles multiple children as an array', () => {
            const a = jsx('span', { children: 'a' });
            const b = jsx('span', { children: 'b' });
            const el = jsxs('div', { children: [a, b] });
            expect(el.children).toHaveLength(2);
            expect(el.children[0]).toBe(a);
            expect(el.children[1]).toBe(b);
        });
    });

    describe('Fragment', () => {
        it('is a symbol', () => {
            expect(typeof Fragment).toBe('symbol');
        });

        it('can be used as a type in jsx', () => {
            const el = jsx(Fragment, { children: 'content' });
            expect(el.type).toBe(Fragment);
            expect(el.children).toEqual(['content']);
        });
    });
});
