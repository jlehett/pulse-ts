/**
 * A listener function.
 * @param e The event.
 */
export type Listener<T> = (e: Readonly<T>) => void;

/**
 * A single-channel, strongly-typed event.
 */
export class TypedEvent<T> {
    private listeners = new Set<Listener<T>>();

    /**
     * Subscribe; returns a disposer.
     * @param fn The listener.
     * @returns A disposer.
     */
    on(fn: Listener<T>): () => void {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    }

    /**
     * Subscribe once; auto-unsubscribes after first emission.
     * @param fn The listener.
     * @returns A disposer.
     */
    once(fn: Listener<T>): () => void {
        const off = this.on((e) => {
            off();
            fn(e);
        });
        return off;
    }

    /**
     * Emit an event to all listeners.
     * @param e The event.
     */
    emit(e: T): void {
        for (const fn of this.listeners) {
            try {
                fn(e);
            } catch (err) {
                console.error(err);
            }
        }
    }

    /**
     * Remove all listeners.
     */
    clear(): void {
        this.listeners.clear();
    }

    /**
     * Current listener count (debug).
     */
    get size(): number {
        return this.listeners.size;
    }
}

/**
 * Multi-channel event bus. `E` maps event names to payloads.
 *
 * @example
 * ```ts
 * type PlayerEvents = { spawn: { id: number }; hit: { dmg: number } };
 * const bus = new EventBus<PlayerEvents>();
 * bus.on('hit', e => ...);
 * ```
 */
export class EventBus<E extends Record<string, any>> {
    private listeners: { [K in keyof E]?: Set<Listener<E[K]>> } = {};

    /**
     * Subscribe to an event.
     * @param type The event type.
     * @param fn The listener.
     * @returns A disposer.
     */
    on<K extends keyof E>(type: K, fn: Listener<E[K]>): () => void {
        (this.listeners[type] ??= new Set()).add(fn);
        return () => this.listeners[type]?.delete(fn);
    }

    /**
     * Subscribe once to an event; auto-unsubscribes after first emission.
     * @param type The event type.
     * @param fn The listener.
     * @returns A disposer.
     */
    once<K extends keyof E>(type: K, fn: Listener<E[K]>): () => void {
        const off = this.on(type, (e) => {
            off();
            fn(e);
        });
        return off;
    }

    /**
     * Emit an event to all listeners.
     * @param type The event type.
     * @param e The event.
     */
    emit<K extends keyof E>(type: K, e: E[K]): void {
        const set = this.listeners[type];
        if (!set) return;
        for (const fn of set) {
            try {
                fn(e);
            } catch (err) {
                console.error(err);
            }
        }
    }

    /**
     * Remove all listeners.
     * @param type The event type.
     */
    clear<K extends keyof E>(type?: K): void {
        if (type) this.listeners[type]?.clear();
        else
            for (const k in this.listeners)
                this.listeners[k as keyof E]?.clear();
    }

    /**
     * Current listener count (debug).
     * @param type The event type.
     * @returns The listener count.
     */
    size<K extends keyof E>(type: K): number {
        return this.listeners[type]?.size ?? 0;
    }
}
