import { Vec3 } from '../math/vec3';
import { current } from './runtime';
import { World } from '../world';
import { Node } from '../node';
import { attachTransform, Transform } from '../transform';
import { attachBounds, Bounds } from '../bounds';
import { ComponentToken, ensureComponent } from '../components/registry';

/**
 * Returns the `World` that is currently mounting the active function component.
 *
 * - Only callable during `world.mount(...)` while the component function is executing.
 * - Throws if used outside of component mount (similar to React hook rules).
 * - The returned reference is stable for the lifetime of the component.
 *
 * @returns The current `World` instance.
 */
export function useWorld(): World {
    return current().world;
}

/**
 * Returns the `Node` associated with the active function component.
 *
 * - Only callable during `world.mount(...)` while the component function is executing.
 * - The returned `Node` is the one created by the current component.
 *
 * @returns The current component's `Node`.
 */
export function useNode(): Node {
    return current().node;
}

/**
 * Registers an initialization hook for the current component.
 *
 * - Each function runs after the component function body has executed and the `Node` was added to the `World`.
 * - If the function returns another function, that returned function is registered as a destroy/cleanup hook.
 *
 * @param fn The function to run on initialization. Optionally returns a cleanup function.
 */
export function useInit(fn: () => void | (() => void)): void {
    current().init.push(fn);
}

/**
 * Registers a destroy/cleanup hook for the current component.
 *
 * - Destroy hooks run when the `Node` is destroyed (explicitly or via parent destruction) or when the component is unmounted.
 * - Hooks are executed in reverse registration order after any registered disposers.
 *
 * @param fn The function to run on destruction.
 */
export function useDestroy(fn: () => void): void {
    current().destroy.push(fn);
}

/**
 * Ensures the current `Node` has a `Transform` attached and returns it.
 *
 * - Subsequent calls return the same `Transform` instance.
 * - The transform provides interpolated local and world TRS queries.
 *
 * @returns The `Transform` attached to the current `Node`.
 */
export function useTransform(): Transform {
    const t = attachTransform(current().node);
    return t;
}

/**
 * Ensures the current `Node` has a Bounds attached and returns it.
 *
 * - The Bounds is used for frustum culling.
 *
 * @param min The minimum point of the Bounds.
 * @param max The maximum point of the Bounds.
 */
export function useBounds(
    min: Readonly<Vec3 | [number, number, number]>,
    max: Readonly<Vec3 | [number, number, number]>,
): Bounds {
    const b = attachBounds(current().node);
    useInit(() => {
        const minV = Array.isArray(min)
            ? new Vec3(min[0], min[1], min[2])
            : (min as Vec3);
        const maxV = Array.isArray(max)
            ? new Vec3(max[0], max[1], max[2])
            : (max as Vec3);
        b.setLocal(minV, maxV);
    });
    return b;
}

/**
 * Options for scheduling a tick.
 */
type TickOpts = { order?: number };

/**
 * Internal helper to register a tick with automatic cleanup.
 */
function reg(
    kind: 'fixed' | 'frame',
    phase: 'early' | 'update' | 'late',
    fn: (dt: number) => void,
    order = 0,
) {
    const { node, world } = current();
    if (!world)
        throw new Error(
            'Node must be added to a World before registering ticks.',
        );
    const reg = world.registerTick(node, kind, phase, fn, order);
    const dispose = () => reg.dispose();
    current().disposers.push(dispose);
    useDestroy(dispose);
}

/**
 * Registers a fixed-step tick in the `early` phase.
 *
 * - Runs at the world's fixed timestep (e.g., 60Hz), before `fixed.update`.
 * - Use for input sampling or pre-physics logic.
 *
 * @param fn Callback invoked with `dt` in seconds for the fixed step.
 * @param opts Optional scheduling options (lower `order` runs earlier; default 0).
 */
export function useFixedEarly(fn: (dt: number) => void, opts: TickOpts = {}) {
    reg('fixed', 'early', fn, opts.order ?? 0);
}

/**
 * Registers a fixed-step tick in the `update` phase.
 *
 * - Runs at the world's fixed timestep after `fixed.early` and before `fixed.late`.
 * - Use for core simulation/physics.
 *
 * @param fn Callback invoked with `dt` in seconds for the fixed step.
 * @param opts Optional scheduling options (lower `order` runs earlier; default 0).
 */
export function useFixedUpdate(fn: (dt: number) => void, opts: TickOpts = {}) {
    reg('fixed', 'update', fn, opts.order ?? 0);
}

/**
 * Registers a fixed-step tick in the `late` phase.
 *
 * - Runs last in the fixed pipeline.
 * - Use for post-physics adjustments or housekeeping.
 *
 * @param fn Callback invoked with `dt` in seconds for the fixed step.
 * @param opts Optional scheduling options (lower `order` runs earlier; default 0).
 */
export function useFixedLate(fn: (dt: number) => void, opts: TickOpts = {}) {
    reg('fixed', 'late', fn, opts.order ?? 0);
}

/**
 * Registers a frame tick in the `early` phase.
 *
 * - Runs once per rendered frame before `frame.update`.
 * - Use for input sampling or preparation work.
 *
 * @param fn Callback invoked with `dt` in seconds for the variable frame step.
 * @param opts Optional scheduling options (lower `order` runs earlier; default 0).
 */
export function useFrameEarly(fn: (dt: number) => void, opts: TickOpts = {}) {
    reg('frame', 'early', fn, opts.order ?? 0);
}

/**
 * Registers a frame tick in the `update` phase.
 *
 * - Runs once per rendered frame after `frame.early` and before `frame.late`.
 * - Use for animation and per-frame logic.
 *
 * @param fn Callback invoked with `dt` in seconds for the variable frame step.
 * @param opts Optional scheduling options (lower `order` runs earlier; default 0).
 */
export function useFrameUpdate(fn: (dt: number) => void, opts: TickOpts = {}) {
    reg('frame', 'update', fn, opts.order ?? 0);
}

/**
 * Registers a frame tick in the `late` phase.
 *
 * - Runs last in the frame pipeline.
 * - Use for cleanup or rendering-adjacent logic.
 *
 * @param fn Callback invoked with `dt` in seconds for the variable frame step.
 * @param opts Optional scheduling options (lower `order` runs earlier; default 0).
 */
export function useFrameLate(fn: (dt: number) => void, opts: TickOpts = {}) {
    reg('frame', 'late', fn, opts.order ?? 0);
}

/**
 * Mounts a child function component as a `Node` parented to the current component's `Node`.
 *
 * - The child is created immediately and added to the same `World`.
 * - The child's lifetime is tied to the parent; destroying the parent destroys the child.
 *
 * @param fc The child component function to mount.
 * @param props Optional props to pass to the child component.
 * @returns The newly mounted child `Node`.
 */
export function useChild<P>(fc: (props: Readonly<P>) => void, props?: P): Node {
    const { world, node } = current();
    return world.mount(fc, props, { parent: node });
}
