import type { Component } from './Component';
import type { Node } from './node';
import type { Ctor } from './types';

/**
 * A store of components.
 */
const store = new Map<Ctor<Component>, WeakMap<Node, Component>>();

/**
 * Gets a component.
 * @param owner The owner of the component.
 * @param Component The component constructor.
 * @returns The component.
 */
export function getComponent<T extends Component>(
    owner: Node,
    Component: Ctor<T>,
): T | undefined {
    const m = store.get(Component);
    return m?.get(owner) as T | undefined;
}

/**
 * Sets a component.
 * @param owner The owner of the component.
 * @param Component The component constructor.
 * @param value The component.
 */
export function setComponent<T extends Component>(owner: Node, value: T): void {
    let m = store.get(value.constructor as Ctor<Component>);
    if (!m) {
        m = new WeakMap<Node, Component>();
        store.set(value.constructor as Ctor<Component>, m);
    }
    m.set(owner, value);
}

/**
 * Attaches a component to the owner.
 * @param owner The owner of the component.
 * @param Component The component constructor.
 * @param factory The factory function to create the component.
 * @returns The component.
 */
export function attachComponent<O extends Node, T extends Component>(
    owner: O,
    Component: Ctor<T>,
): T {
    const existing = getComponent(owner, Component);
    if (existing) return existing;
    const value = (Component as any).attach(owner);
    setComponent(owner, value);
    return value;
}
