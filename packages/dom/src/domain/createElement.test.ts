import { createElement } from './createElement';
import { Fragment } from './types';
import type { PulseElement, DomFC } from './types';

/** Helper to build a PulseElement without JSX */
function el(
    type: PulseElement['type'],
    props: Record<string, any>,
    ...children: any[]
): PulseElement {
    return { type, props, children };
}

describe('createElement', () => {
    describe('intrinsic elements', () => {
        it('creates a DOM element for a tag string', () => {
            const { root } = createElement(el('div', {}));
            expect(root).toBeInstanceOf(HTMLDivElement);
        });

        it('applies static attributes', () => {
            const { root } = createElement(el('div', { id: 'test' }));
            expect((root as HTMLElement).getAttribute('id')).toBe('test');
        });

        it('applies static style properties', () => {
            const { root } = createElement(
                el('div', { style: { color: 'red', fontSize: '16px' } }),
            );
            const div = root as HTMLElement;
            expect(div.style.color).toBe('red');
            expect(div.style.fontSize).toBe('16px');
        });

        it('applies className', () => {
            const { root } = createElement(el('div', { className: 'foo bar' }));
            expect((root as HTMLElement).className).toBe('foo bar');
        });

        it('registers event listeners', () => {
            const handler = jest.fn();
            const { root } = createElement(el('button', { onClick: handler }));
            (root as HTMLElement).click();
            expect(handler).toHaveBeenCalledTimes(1);
        });

        it('appends static text children', () => {
            const { root } = createElement(el('span', {}, 'hello'));
            expect((root as HTMLElement).textContent).toBe('hello');
        });

        it('appends number children as text', () => {
            const { root } = createElement(el('span', {}, 42));
            expect((root as HTMLElement).textContent).toBe('42');
        });

        it('skips null, undefined, and boolean children', () => {
            const { root } = createElement(
                el('div', {}, null, undefined, true, false, 'text'),
            );
            expect((root as HTMLElement).childNodes).toHaveLength(1);
            expect((root as HTMLElement).textContent).toBe('text');
        });

        it('nests child elements', () => {
            const tree = el('div', {}, el('span', {}, 'inner'));
            const { root } = createElement(tree);
            const div = root as HTMLElement;
            expect(div.children).toHaveLength(1);
            expect(div.children[0]!.tagName).toBe('SPAN');
            expect(div.children[0]!.textContent).toBe('inner');
        });
    });

    describe('Fragment', () => {
        it('creates a DocumentFragment', () => {
            const { root } = createElement(el(Fragment, {}, 'a', 'b'));
            expect(root).toBeInstanceOf(DocumentFragment);
            expect(root.childNodes).toHaveLength(2);
        });

        it('flattens fragment children into parent', () => {
            const tree = el(
                'div',
                {},
                el(Fragment, {}, el('span', {}, 'a'), el('span', {}, 'b')),
            );
            const { root } = createElement(tree);
            const div = root as HTMLElement;
            expect(div.children).toHaveLength(2);
        });
    });

    describe('functional components', () => {
        it('calls the component function once and renders its result', () => {
            const MyComponent: DomFC<{ label: string }> = jest.fn((props) =>
                el('span', {}, props.label),
            );

            const tree = el(MyComponent, { label: 'test' });
            const { root } = createElement(tree);
            expect(MyComponent).toHaveBeenCalledTimes(1);
            expect(MyComponent).toHaveBeenCalledWith(
                expect.objectContaining({ label: 'test' }),
            );
            expect((root as HTMLElement).textContent).toBe('test');
        });

        it('passes children to component props', () => {
            const Wrapper: DomFC<{ children: any }> = (props) =>
                el('div', { className: 'wrapper' }, props.children);

            const tree = el(Wrapper, {}, el('span', {}, 'child'));
            const { root } = createElement(tree);
            const div = root as HTMLElement;
            expect(div.className).toBe('wrapper');
            expect(div.children[0]!.tagName).toBe('SPAN');
        });
    });

    describe('reactive bindings', () => {
        it('registers a binding for reactive text children', () => {
            let value = 'initial';
            const getter = () => value;

            const tree = el('span', {}, getter);
            const { root, bindings } = createElement(tree);
            expect((root as HTMLElement).textContent).toBe('initial');
            expect(bindings).toHaveLength(1);

            // Simulate frame update
            value = 'updated';
            const next = bindings[0]!.get();
            expect(next).toBe('updated');
            bindings[0]!.apply(next);
            expect((root as HTMLElement).textContent).toBe('updated');
        });

        it('registers a binding for reactive style properties', () => {
            let width = '50%';
            const tree = el('div', { style: { width: () => width } });
            const { root, bindings } = createElement(tree);
            expect((root as HTMLElement).style.width).toBe('50%');
            expect(bindings).toHaveLength(1);

            width = '75%';
            const next = bindings[0]!.get();
            bindings[0]!.apply(next);
            expect((root as HTMLElement).style.width).toBe('75%');
        });

        it('registers a binding for reactive className', () => {
            let cls = 'active';
            const tree = el('div', { className: () => cls });
            const { root, bindings } = createElement(tree);
            expect((root as HTMLElement).className).toBe('active');

            cls = 'inactive';
            const next = bindings[0]!.get();
            bindings[0]!.apply(next);
            expect((root as HTMLElement).className).toBe('inactive');
        });

        it('registers a binding for reactive attributes', () => {
            let title = 'hello';
            const tree = el('div', { title: () => title });
            const { root, bindings } = createElement(tree);
            expect((root as HTMLElement).getAttribute('title')).toBe('hello');

            title = 'world';
            const next = bindings[0]!.get();
            bindings[0]!.apply(next);
            expect((root as HTMLElement).getAttribute('title')).toBe('world');
        });

        it('registers a binding for visible prop', () => {
            let show = true;
            const tree = el('div', { visible: () => show });
            const { root, bindings } = createElement(tree);
            expect((root as HTMLElement).style.display).toBe('');

            show = false;
            const next = bindings[0]!.get();
            bindings[0]!.apply(next);
            expect((root as HTMLElement).style.display).toBe('none');
        });

        it('applies static visible=false', () => {
            const tree = el('div', { visible: false });
            const { root } = createElement(tree);
            expect((root as HTMLElement).style.display).toBe('none');
        });

        it('does not create bindings for static values', () => {
            const tree = el(
                'div',
                {
                    id: 'static',
                    style: { color: 'red' },
                },
                'text',
            );
            const { bindings } = createElement(tree);
            expect(bindings).toHaveLength(0);
        });
    });

    describe('nested arrays of children', () => {
        it('flattens nested child arrays', () => {
            const tree: PulseElement = {
                type: 'div',
                props: {},
                children: [
                    [el('span', {}, 'a'), el('span', {}, 'b')],
                    el('span', {}, 'c'),
                ],
            };
            const { root } = createElement(tree);
            expect((root as HTMLElement).children).toHaveLength(3);
        });
    });
});
