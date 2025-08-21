export type Unsubscribe = () => void;

/**
 * Minimal, typed signal/event.
 * Supports subscription priorities and one-shot listeners.
 */
export class Signal<T> {
    private listeners: {
        callback: (payload: T) => void;
        once: boolean;
        priority: number;
    }[] = [];

    subscribe(callback: (payload: T) => void, priority = 0): Unsubscribe {
        const entry = { callback, once: false, priority };
        this.listeners.push(entry);
        this.listeners.sort((a, b) => b.priority - a.priority);
        return () => this.off(callback);
    }

    once(callback: (payload: T) => void, priority = 0): Unsubscribe {
        const entry = { callback, once: true, priority };
        this.listeners.push(entry);
        this.listeners.sort((a, b) => b.priority - a.priority);
        return () => this.off(callback);
    }

    emit(payload: T): void {
        if (this.listeners.length === 0) return;
        // Copy to be robust to listeners mutating the array
        for (const entry of this.listeners.slice()) {
            entry.callback(payload);
            if (entry.once) this.off(entry.callback);
        }
    }

    off(callback: (payload: T) => void): void {
        const index = this.listeners.findIndex((l) => l.callback === callback);
        if (index >= 0) this.listeners.splice(index, 1);
    }

    clear(): void {
        for (const entry of this.listeners) {
            this.off(entry.callback);
        }
        this.listeners = [];
    }
}
