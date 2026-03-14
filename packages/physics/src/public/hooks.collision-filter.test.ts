import {
    World,
    Node,
    attachComponent,
    Transform,
    Component,
    getComponent,
    useComponent,
} from '@pulse-ts/core';
import { installPhysics, RigidBody } from '../index';
import { Collider } from './components/Collider';
import {
    useOnCollisionStart,
    useOnCollisionEnd,
    useOnCollision,
} from './hooks';

class TagA extends Component {}
class TagB extends Component {}

/**
 * Creates two overlapping sphere-collider nodes and returns helpers
 * to step the physics world, inspecting collision events via the hooks.
 */
function setup(
    hookFn: typeof useOnCollisionStart,
    filterOpt?: Parameters<typeof useOnCollisionStart>[1],
) {
    const world = new World({ fixedStepMs: 10 });
    const physics = installPhysics(world, {
        gravity: { x: 0, y: 0, z: 0 },
    });

    const calls: Array<{ self: Node; other: Node }> = [];

    // Create the "other" node manually
    const otherNode = new Node();
    world.add(otherNode);
    const otherTransform = attachComponent(otherNode, Transform);
    otherTransform.localPosition.set(0, 2, 0); // start far away
    const otherRb = attachComponent(otherNode, RigidBody);
    otherRb.type = 'static';
    const otherCol = attachComponent(otherNode, Collider);
    otherCol.kind = 'sphere';
    otherCol.radius = 0.5;

    // Mount the hook-bearing FC — useComponent attaches to the FC's own node
    function CollisionListener() {
        const transform = useComponent(Transform);
        transform.localPosition.set(0, 0, 0);
        const rb = useComponent(RigidBody);
        rb.type = 'static';
        const col = useComponent(Collider);
        col.kind = 'sphere';
        col.radius = 0.5;
        hookFn((e) => calls.push(e), filterOpt);
    }

    const mountedNode = world.mount(CollisionListener);

    return {
        world,
        physics,
        calls,
        selfNode: mountedNode,
        otherNode,
        otherTransform,
        /** Move other into overlap with self */
        moveIntoContact() {
            otherTransform.localPosition.set(0, 0.8, 0);
        },
        /** Move other far from self */
        moveFarAway() {
            otherTransform.localPosition.set(0, 10, 0);
        },
        step(n = 1) {
            for (let i = 0; i < n; i++) physics.step(0);
        },
    };
}

describe('useOnCollisionStart — filter', () => {
    it('fires without filter (backward compatible)', () => {
        const { calls, moveIntoContact, step } = setup(useOnCollisionStart);
        moveIntoContact();
        step();
        expect(calls.length).toBe(1);
    });

    it('fires when component shorthand matches', () => {
        const { calls, moveIntoContact, step, otherNode } = setup(
            useOnCollisionStart,
            { filter: TagA },
        );
        attachComponent(otherNode, TagA);
        moveIntoContact();
        step();
        expect(calls.length).toBe(1);
    });

    it('does NOT fire when component shorthand does not match', () => {
        const { calls, moveIntoContact, step } = setup(useOnCollisionStart, {
            filter: TagA,
        });
        moveIntoContact();
        step();
        expect(calls.length).toBe(0);
    });

    it('fires when predicate returns true', () => {
        const { calls, moveIntoContact, step, otherNode } = setup(
            useOnCollisionStart,
            { filter: (other) => !!getComponent(other, TagA) },
        );
        attachComponent(otherNode, TagA);
        moveIntoContact();
        step();
        expect(calls.length).toBe(1);
    });

    it('does NOT fire when predicate returns false', () => {
        const { calls, moveIntoContact, step } = setup(useOnCollisionStart, {
            filter: () => false,
        });
        moveIntoContact();
        step();
        expect(calls.length).toBe(0);
    });

    it('supports complex predicates (multiple component checks)', () => {
        const { calls, moveIntoContact, step, otherNode } = setup(
            useOnCollisionStart,
            {
                filter: (other) =>
                    !!getComponent(other, TagA) && !getComponent(other, TagB),
            },
        );
        attachComponent(otherNode, TagA);
        moveIntoContact();
        step();
        expect(calls.length).toBe(1);
    });
});

describe('useOnCollisionEnd — filter', () => {
    it('fires without filter', () => {
        const { calls, moveIntoContact, moveFarAway, step } =
            setup(useOnCollisionEnd);
        moveIntoContact();
        step();
        expect(calls.length).toBe(0);
        moveFarAway();
        step();
        expect(calls.length).toBe(1);
    });

    it('fires when component shorthand matches', () => {
        const { calls, moveIntoContact, moveFarAway, step, otherNode } = setup(
            useOnCollisionEnd,
            { filter: TagA },
        );
        attachComponent(otherNode, TagA);
        moveIntoContact();
        step();
        moveFarAway();
        step();
        expect(calls.length).toBe(1);
    });

    it('does NOT fire when component shorthand does not match', () => {
        const { calls, moveIntoContact, moveFarAway, step } = setup(
            useOnCollisionEnd,
            { filter: TagA },
        );
        moveIntoContact();
        step();
        moveFarAway();
        step();
        expect(calls.length).toBe(0);
    });
});

describe('useOnCollision — filter', () => {
    it('fires without filter', () => {
        const { calls, moveIntoContact, step } = setup(useOnCollision);
        moveIntoContact();
        step();
        expect(calls.length).toBe(1);
        step();
        expect(calls.length).toBe(2);
    });

    it('fires when component shorthand matches', () => {
        const { calls, moveIntoContact, step, otherNode } = setup(
            useOnCollision,
            { filter: TagA },
        );
        attachComponent(otherNode, TagA);
        moveIntoContact();
        step();
        expect(calls.length).toBe(1);
        step();
        expect(calls.length).toBe(2);
    });

    it('does NOT fire when component shorthand does not match', () => {
        const { calls, moveIntoContact, step } = setup(useOnCollision, {
            filter: TagA,
        });
        moveIntoContact();
        step();
        step();
        expect(calls.length).toBe(0);
    });

    it('fires when predicate returns true', () => {
        const { calls, moveIntoContact, step, otherNode } = setup(
            useOnCollision,
            { filter: (other) => !!getComponent(other, TagA) },
        );
        attachComponent(otherNode, TagA);
        moveIntoContact();
        step();
        expect(calls.length).toBe(1);
    });

    it('does NOT fire when predicate returns false', () => {
        const { calls, moveIntoContact, step } = setup(useOnCollision, {
            filter: () => false,
        });
        moveIntoContact();
        step();
        expect(calls.length).toBe(0);
    });
});
