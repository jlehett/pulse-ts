import { Component } from '../../ecs/base/Component';

/**
 * Generic key/value state store component for a Node.
 */
export class State extends Component {
    private values = new Map<string, unknown>();

    has(key: string): boolean {
        return this.values.has(key);
    }

    get<T = unknown>(key: string): T | undefined {
        return this.values.get(key) as T | undefined;
    }

    set<T = unknown>(key: string, value: T): void {
        this.values.set(key, value);
    }

    entries(): Array<[string, unknown]> {
        return Array.from(this.values.entries());
    }

    loadEntries(entries: Array<[string, unknown]>): void {
        this.values.clear();
        for (const [k, v] of entries) this.values.set(k, v);
    }
}
