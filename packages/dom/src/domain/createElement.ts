import type {
    PulseElement,
    PulseChild,
    ReactiveBinding,
    DomTree,
    DomFC,
} from './types';
import { Fragment } from './types';

/**
 * Materializes a {@link PulseElement} tree into real DOM nodes.
 *
 * Walks the JSX tree depth-first, creating elements, applying props/styles,
 * and collecting reactive bindings. Each binding is evaluated once to set
 * the initial DOM state and then dirty-checked each frame by the caller.
 *
 * @param element - The JSX element tree to render.
 * @returns A {@link DomTree} containing the root DOM node and all reactive bindings.
 */
export function createElement(element: PulseElement): DomTree {
    const bindings: ReactiveBinding[] = [];
    const root = build(element, bindings);
    return { root, bindings };
}

function build(
    element: PulseElement,
    bindings: ReactiveBinding[],
): globalThis.Element | DocumentFragment {
    const { type, props, children } = element;

    // Fragment — just a container for children
    if (type === Fragment) {
        const frag = document.createDocumentFragment();
        appendChildren(frag, children, bindings);
        return frag;
    }

    // Functional component — call once, build result
    if (typeof type === 'function') {
        const fc = type as DomFC<any>;
        const childProps = { ...props };
        if (children.length > 0) {
            childProps.children =
                children.length === 1 ? children[0] : children;
        }
        const result = fc(childProps);
        return build(result, bindings);
    }

    // Intrinsic HTML element
    const el = document.createElement(type as string);

    // Apply props
    for (const [key, value] of Object.entries(props)) {
        if (key === 'children') continue;

        if (key === 'style' && typeof value === 'object' && value !== null) {
            applyStyle(el, value as Record<string, unknown>, bindings);
        } else if (key === 'visible' && value !== undefined) {
            applyVisible(el, value, bindings);
        } else if (key.startsWith('on') && typeof value === 'function') {
            const event = key.slice(2).toLowerCase();
            el.addEventListener(event, value as EventListener);
        } else if (key === 'className') {
            if (typeof value === 'function') {
                const getter = value as () => string;
                bindings.push({
                    get: getter,
                    prev: getter(),
                    apply: (v) => {
                        el.className = v as string;
                    },
                });
                el.className = getter();
            } else {
                el.className = value as string;
            }
        } else if (typeof value === 'function') {
            const getter = value as () => unknown;
            const initial = getter();
            bindings.push({
                get: getter,
                prev: initial,
                apply: (v) => el.setAttribute(key, String(v)),
            });
            el.setAttribute(key, String(initial));
        } else if (value != null && value !== false) {
            el.setAttribute(key, String(value));
        }
    }

    // Append children
    appendChildren(el, children, bindings);

    return el;
}

function appendChildren(
    parent: globalThis.Element | DocumentFragment,
    children: PulseChild[],
    bindings: ReactiveBinding[],
): void {
    for (const child of children) {
        if (child == null || typeof child === 'boolean') continue;

        if (Array.isArray(child)) {
            appendChildren(parent, child, bindings);
        } else if (typeof child === 'object' && 'type' in child) {
            const node = build(child as PulseElement, bindings);
            parent.appendChild(node);
        } else if (typeof child === 'function') {
            const getter = child as () => string | number;
            const initial = String(getter());
            const textNode = document.createTextNode(initial);
            bindings.push({
                get: getter,
                prev: initial,
                apply: (v) => {
                    textNode.textContent = String(v);
                },
            });
            parent.appendChild(textNode);
        } else {
            parent.appendChild(document.createTextNode(String(child)));
        }
    }
}

function applyStyle(
    el: HTMLElement,
    style: Record<string, unknown>,
    bindings: ReactiveBinding[],
): void {
    for (const [prop, value] of Object.entries(style)) {
        if (typeof value === 'function') {
            const getter = value as () => string;
            const initial = getter();
            el.style.setProperty(camelToKebab(prop), initial);
            bindings.push({
                get: getter,
                prev: initial,
                apply: (v) =>
                    el.style.setProperty(camelToKebab(prop), v as string),
            });
        } else if (value != null) {
            el.style.setProperty(camelToKebab(prop), String(value));
        }
    }
}

function applyVisible(
    el: HTMLElement,
    value: unknown,
    bindings: ReactiveBinding[],
): void {
    if (typeof value === 'function') {
        const getter = value as () => boolean;
        const initial = getter();
        el.style.display = initial ? '' : 'none';
        bindings.push({
            get: getter,
            prev: initial,
            apply: (v) => {
                el.style.display = v ? '' : 'none';
            },
        });
    } else {
        el.style.display = value ? '' : 'none';
    }
}

function camelToKebab(str: string): string {
    return str.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}
