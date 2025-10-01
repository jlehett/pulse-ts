/**
 * Generic constructor-keyed registry for engine singletons.
 *
 * Used by ServiceRegistry and SystemRegistry to reduce duplication.
 *
 * @example
 * ```ts
 * class Base {}
 * class A extends Base { n = 1 }
 * class B extends Base { s = 'x' }
 * const reg = new CtorRegistry<Base>();
 * reg.set(new A());
 * reg.set(new B());
 * reg.get(A)?.n; // 1
 * reg.remove(A);
 * ```
 */
export class CtorRegistry<TBase> {
    private m = new Map<new () => TBase | ThisParameterType<TBase>, TBase>();

    /** Sets an instance keyed by its constructor. */
    set<T extends TBase>(instance: T): void {
        this.m.set((instance as any).constructor, instance);
    }

    /** Gets an instance by constructor. */
    get<T extends TBase>(
        Ctor: new () => T | ThisParameterType<T>,
    ): T | undefined {
        return this.m.get(Ctor as any) as T | undefined;
    }

    /** Removes an instance by constructor. */
    remove<T extends TBase>(Ctor: new () => T | ThisParameterType<T>): void {
        this.m.delete(Ctor as any);
    }

    /** Iterates stored instances. */
    values(): Iterable<TBase> {
        return this.m.values();
    }

    /** Clears all entries. */
    clear(): void {
        this.m.clear();
    }
}
