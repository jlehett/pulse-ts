import { Component } from '../Component';

/**
 * Generic key/value state store component for a Node.
 *
 * - JSON-serializable values are recommended for persistence with @pulse-ts/save.
 * - Intended to back FC state hooks (e.g., useState) without a re-render model.
 */
export class State extends Component {
    private values = new Map<string, unknown>();

    /**
     * Checks if a value exists for a given key.
     * @param key The key to check.
     * @returns True if a value exists for the given key, false otherwise.
     */
    has(key: string): boolean {
        return this.values.has(key);
    }

    /**
     * Gets a value for a given key.
     * @param key The key to get the value for.
     * @returns The value for the given key, or undefined if no value exists.
     */
    get<T = unknown>(key: string): T | undefined {
        return this.values.get(key) as T | undefined;
    }

    /**
     * Sets a value for a given key.
     * @param key The key to set the value for.
     * @param value The value to set.
     */
    set<T = unknown>(key: string, value: T): void {
        this.values.set(key, value);
    }

    /**
     * Returns a plain array of [key, value] for serialization.
     * @returns A plain array of [key, value] for serialization.
     */
    entries(): Array<[string, unknown]> {
        return Array.from(this.values.entries());
    }

    /**
     * Loads entries from a plain array of [key, value].
     * @param entries The entries to load.
     */
    loadEntries(entries: Array<[string, unknown]>): void {
        this.values.clear();
        for (const [k, v] of entries) this.values.set(k, v);
    }
}
