import type { World } from '../world/world';
import type { Node } from './node';
import { getComponent } from './componentRegistry';
import type { Component } from './Component';
import type { ComponentCtor } from './types';

/**
 * Defines a reusable typed query that matches nodes that have all components in `has`
 * and none of the components in `not`.
 *
 * Result tuples are ordered as `[node, ...componentsInOrder]`.
 *
 * @example
 * ```ts
 * const QB = defineQuery([Transform, Bounds]);
 * for (const [node, t, b] of QB.run(world)) {
 *   // use t and b
 * }
 * ```
 */
export function defineQuery<
    const Has extends readonly ComponentCtor[],
    const Not extends readonly ComponentCtor[] = [],
>(has: Has, opts?: { not?: Not }) {
    function* run(
        world: World,
    ): IterableIterator<[Node, ...{ [K in keyof Has]: InstanceType<Has[K]> }]> {
        const not = opts?.not ?? ([] as const);
        for (const n of world.nodes) {
            // require all `has`
            const comps: Component[] = [];
            let ok = true;
            for (let i = 0; i < has.length; i++) {
                const C = has[i] as ComponentCtor<Component>;
                const inst = getComponent(n, C);
                if (!inst) {
                    ok = false;
                    break;
                }
                comps.push(inst);
            }
            if (!ok) continue;
            // exclude any `not`
            let bad = false;
            for (let i = 0; i < not.length; i++) {
                const NC = not[i] as ComponentCtor<Component>;
                if (getComponent(n, NC)) {
                    bad = true;
                    break;
                }
            }
            if (bad) continue;
            yield [n, ...(comps as any)];
        }
    }
    function some(world: World): boolean {
        return !run(world).next().done;
    }
    function count(world: World): number {
        let c = 0;
        for (const item of run(world)) {
            c++;
            void item;
        }
        return c;
    }
    return { run, some, count } as const;
}

/**
 * Convenience one-off query helper. See `defineQuery` for behavior.
 *
 * @example
 * ```ts
 * for (const [node, t] of query(world, [Transform])) {
 *   // ...
 * }
 * ```
 */
export function query<const Has extends readonly ComponentCtor[]>(
    world: World,
    has: Has,
    opts?: { not?: readonly ComponentCtor[] },
): IterableIterator<[Node, ...{ [K in keyof Has]: InstanceType<Has[K]> }]> {
    return defineQuery(has as any, { not: opts?.not as any }).run(world) as any;
}
