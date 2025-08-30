/**
 * A component token is a unique symbol that identifies a component.
 */
export type ComponentToken<T> = symbol & { __component?: T };

/**
 * Creates a component token.
 * @param desc The description of the component.
 * @returns The component token.
 */
export function createComponentToken<T>(desc: string): ComponentToken<T> {
    return Symbol(desc) as ComponentToken<T>;
}

/**
 * A store of components.
 */
const store = new Map<symbol, WeakMap<object, any>>();

/**
 * Gets a component.
 * @param owner The owner of the component.
 * @param token The component token.
 * @returns The component.
 */
export function getComponent<T>(
    owner: object,
    token: ComponentToken<T>,
): T | undefined {
    const m = store.get(token as unknown as symbol);
    return m?.get(owner) as T | undefined;
}

/**
 * Sets a component.
 * @param owner The owner of the component.
 * @param token The component token.
 * @param value The component.
 */
export function setComponent<T>(
    owner: object,
    token: ComponentToken<T>,
    value: T,
): void {
    let m = store.get(token as unknown as symbol);
    if (!m) {
        m = new WeakMap<object, any>();
        store.set(token as unknown as symbol, m);
    }
    m.set(owner, value);
}

/**
 * Ensures a component.
 * @param owner The owner of the component.
 * @param token The component token.
 * @param factory The factory function to create the component.
 * @returns The component.
 */
export function ensureComponent<T>(
    owner: object,
    token: ComponentToken<T>,
    factory: () => T,
): T {
    const existing = getComponent(owner, token);
    if (existing) return existing;
    const v = factory();
    setComponent(owner, token, v);
    return v;
}
