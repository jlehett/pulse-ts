import { World, mount } from '@pulse-ts/core';
import {
    installInput,
    useAxis2D,
    useAxis1D,
    useAction,
    usePointer,
    Axis2D,
    Axis1D,
    Key,
    PointerMovement,
} from '../index';

describe('hooks', () => {
    test('useAxis2D returns accessor reading InputService', () => {
        const world = new World();
        const svc = installInput(world, {
            bindings: {
                move: Axis2D({
                    x: { pos: Key('D'), neg: Key('A') },
                    y: { pos: Key('W'), neg: Key('S') },
                }),
            },
        });

        let readMove: (() => Record<string, number>) | null = null;
        mount(
            world,
            () => {
                readMove = useAxis2D('move');
            },
            undefined,
        );

        expect(readMove).toBeTruthy();
        expect(readMove!()).toMatchObject({ x: 0, y: 0 });

        // Simulate D key (x positive)
        svc.handleKey('KeyD', true);
        svc.commit();
        expect(readMove!()).toMatchObject({ x: 1, y: 0 });
    });

    test('useAction and useAxis1D and usePointer accessors', () => {
        const world = new World();
        const svc = installInput(world, {
            bindings: {
                jump: Key('Space'),
                zoom: Axis1D({ pos: Key('Equal'), neg: Key('Minus') }),
                look: PointerMovement({}),
            },
        });

        let readJump: (() => { pressed: boolean }) | null = null;
        let readZoom: (() => number) | null = null;
        let readPointer: (() => { deltaX: number; deltaY: number }) | null =
            null;

        mount(
            world,
            () => {
                readJump = useAction('jump') as any;
                readZoom = useAxis1D('zoom');
                readPointer = usePointer() as any;
            },
            undefined,
        );

        expect(readJump && readZoom && readPointer).toBeTruthy();
        expect(readJump!().pressed).toBe(false);
        expect(readZoom!()).toBe(0);

        // simulate input
        svc.handleKey('Space', true);
        svc.handleKey('Equal', true);
        svc.handlePointerMove(0, 0, 3, -1, false, 0);
        svc.commit();

        expect(readJump!().pressed).toBe(true);
        expect(readZoom!()).toBe(1);
        expect(readPointer!().deltaX).toBe(3);
    });
});
