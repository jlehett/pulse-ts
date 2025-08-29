import { World } from '../world';
import { Node } from '../node';

/**
 * A function component.
 */
export type FC<P = object> = (props: Readonly<P>) => void;

/**
 * A hook bucket.
 */
type HookBucket = {
    init: Array<() => void | (() => void)>;
    destroy: Array<() => void>;
    disposers: Array<() => void>;
    node: Node;
    world: World;
};

/**
 * The stack of hook buckets.
 */
const stack: HookBucket[] = [];

/**
 * Mounts a function component.
 * @param world The world to mount the component in.
 * @param fc The function component to mount.
 * @param props The props to pass to the component.
 * @param opts The options for the mount.
 * @returns The node that was mounted.
 */
export function mountFC<P>(
    world: World,
    fc: FC<P>,
    props: P | undefined,
    opts?: { parent?: Node | null },
): Node {
    const node = new Node();
    const bucket: HookBucket = {
        init: [],
        destroy: [],
        disposers: [],
        node,
        world,
    };
    stack.push(bucket);
    // parent first (so attach cascades)
    if (opts?.parent) opts.parent.addChild(node);
    world.add(node);

    // run FC body to register hooks
    fc(props ?? ({} as P));

    // run init hooks
    for (const fn of bucket.init) {
        const cleanup = fn();
        if (typeof cleanup === 'function') bucket.destroy.push(cleanup);
    }
    stack.pop();

    // ensure cleanup/disposers run on node destruction
    node.onDestroy = () => {
        for (let i = bucket.disposers.length - 1; i >= 0; i--) {
            try {
                bucket.disposers[i]!();
            } catch (e) {
                console.error(e);
            }
        }
        for (let i = bucket.destroy.length - 1; i >= 0; i--) {
            try {
                bucket.destroy[i]!();
            } catch (e) {
                console.error(e);
            }
        }
    };
    return node;
}

// hook accessors
export function current(): HookBucket {
    const b = stack[stack.length - 1];
    if (!b)
        throw new Error(
            'Hooks can only be called during world.mount() of a function component.',
        );
    return b;
}

// one-line alias for other packages
export const __fcCurrent = current;
