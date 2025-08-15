import { DynamicNode } from './DynamicNode';
import { World } from './World';

describe('DynamicNode', () => {
    describe('onUpdate', () => {
        it('should be called on each tick of the World', async () => {
            const testOnUpdateFn = jest.fn();
            const testWorldTickFn = jest.fn();

            class TestWorld extends World {
                protected update(delta: number) {
                    super.update(delta);
                    testWorldTickFn(delta);
                }
            }

            class TestNode extends DynamicNode {
                constructor(world: World) {
                    super(world);
                }

                onUpdate(delta: number) {
                    testOnUpdateFn(delta);
                }
            }

            const world = new TestWorld();
            world.createNode(TestNode)({});

            world.start();
            await new Promise<void>((resolve) => {
                setTimeout(() => {
                    world.stop();
                    resolve();
                }, 200);
            });

            expect(testOnUpdateFn).toHaveBeenCalled();
            expect(testWorldTickFn).toHaveBeenCalled();
            expect(testOnUpdateFn.mock.calls.length).toEqual(
                testWorldTickFn.mock.calls.length,
            );
        });
    });
});
