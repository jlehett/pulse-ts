export type Unsubscribe = () => void;

/**
 * Minimal, typed signal/event.
 * Supports subscription priorities and one-shot listeners.
 */
export class Signal<T> {
    //#region Fields

    private listeners: {
        callback: (payload: T) => void;
        once: boolean;
        priority: number;
    }[] = [];

    //#endregion

    //#region Public Methods

    /**
     * Subscribe to the signal.
     * @param callback The callback to invoke when the signal is emitted.
     * @param priority The priority of the callback. Higher priority callbacks are invoked first.
     * @returns A function to unsubscribe from the signal.
     */
    subscribe(callback: (payload: T) => void, priority = 0): Unsubscribe {
        const entry = { callback, once: false, priority };
        this.listeners.push(entry);
        this.listeners.sort((a, b) => b.priority - a.priority);
        return () => this.off(callback);
    }

    /**
     * Subscribe to the signal once. The callback will be invoked once and then unsubscribed.
     * @param callback The callback to invoke when the signal is emitted.
     * @param priority The priority of the callback. Higher priority callbacks are invoked first.
     * @returns A function to unsubscribe from the signal.
     */
    once(callback: (payload: T) => void, priority = 0): Unsubscribe {
        const entry = { callback, once: true, priority };
        this.listeners.push(entry);
        this.listeners.sort((a, b) => b.priority - a.priority);
        return () => this.off(callback);
    }

    /**
     * Emit the signal.
     * @param payload The payload to emit.
     */
    emit(payload: T): void {
        if (this.listeners.length === 0) return;
        // Copy to be robust to listeners mutating the array
        for (const entry of this.listeners.slice()) {
            entry.callback(payload);
            if (entry.once) this.off(entry.callback);
        }
    }

    /**
     * Unsubscribe from the signal.
     * @param callback The callback to unsubscribe.
     */
    off(callback: (payload: T) => void): void {
        const index = this.listeners.findIndex((l) => l.callback === callback);
        if (index >= 0) this.listeners.splice(index, 1);
    }

    /**
     * Unsubscribe all listeners.
     */
    clear(): void {
        for (const entry of this.listeners) {
            this.off(entry.callback);
        }
        this.listeners = [];
    }

    //#endregion
}
