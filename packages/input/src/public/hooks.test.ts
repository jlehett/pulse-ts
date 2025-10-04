import { World, mount } from '@pulse-ts/core';
import { installInput, useAxis2D, Axis2D, Key } from '../index';

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
});
