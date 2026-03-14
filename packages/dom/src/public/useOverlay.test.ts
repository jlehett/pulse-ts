import type { PulseElement } from '../domain/types';

// Mock @pulse-ts/core hooks
const destroyFns: Array<() => void> = [];
const frameFns: Array<(dt: number) => void> = [];

jest.mock('@pulse-ts/core', () => ({
    useDestroy: (fn: () => void) => destroyFns.push(fn),
    useFrameUpdate: (fn: (dt: number) => void) => frameFns.push(fn),
}));

import { useOverlay } from './useOverlay';

/** Helper to build a PulseElement */
function el(
    type: PulseElement['type'],
    props: Record<string, any>,
    ...children: any[]
): PulseElement {
    return { type, props, children };
}

describe('useOverlay', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
        destroyFns.length = 0;
        frameFns.length = 0;
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        container.remove();
    });

    it('appends the element to the provided container', () => {
        useOverlay(el('div', { id: 'overlay' }, 'content'), container);
        expect(container.children).toHaveLength(1);
        expect(container.children[0]!.id).toBe('overlay');
        expect(container.textContent).toBe('content');
    });

    it('appends to document.body by default', () => {
        const root = useOverlay(el('span', {}, 'body-child'));
        expect(document.body.contains(root as Node)).toBe(true);
        // Cleanup
        if (root.parentNode) root.parentNode.removeChild(root);
    });

    it('registers a useDestroy handler that removes the element', () => {
        useOverlay(el('div', { id: 'cleanup-test' }), container);
        expect(container.children).toHaveLength(1);

        // Simulate destroy
        for (const fn of destroyFns) fn();
        expect(container.children).toHaveLength(0);
    });

    it('registers useFrameUpdate for reactive bindings', () => {
        let value = 'initial';
        const tree = el('span', {}, () => value);
        useOverlay(tree, container);

        expect(frameFns).toHaveLength(1);
        expect(container.textContent).toBe('initial');

        // Simulate frame with no change
        frameFns[0]!(0.016);
        expect(container.textContent).toBe('initial');

        // Change value and tick
        value = 'updated';
        frameFns[0]!(0.016);
        expect(container.textContent).toBe('updated');
    });

    it('does not register useFrameUpdate when there are no bindings', () => {
        useOverlay(el('div', {}, 'static'), container);
        expect(frameFns).toHaveLength(0);
    });

    it('handles destroy when element is already removed', () => {
        useOverlay(el('div', {}), container);
        container.innerHTML = '';
        // Should not throw
        expect(() => {
            for (const fn of destroyFns) fn();
        }).not.toThrow();
    });
});
