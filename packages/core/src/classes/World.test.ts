import { DynamicNode } from './DynamicNode';
import { Node } from './Node';
import { World } from './World';

describe('World', () => {
    describe('isRunning', () => {
        it('should return false when the world is first created', () => {
            const world = new World();
            expect(world.isRunning).toBe(false);
        });

        it('should return true after starting the world', () => {
            const world = new World();
            world.start();
            expect(world.isRunning).toBe(true);
        });

        it('should return false after stopping the world', () => {
            const world = new World();
            world.start();
            world.stop();
            expect(world.isRunning).toBe(false);
        });
    });

    describe('start', () => {
        it('should mark the world as running', () => {
            const world = new World();
            world.start();
            expect(world.isRunning).toBe(true);
        });

        it('should begin the update loop', (done) => {
            const testFn = jest.fn();

            class TestNode extends DynamicNode {
                constructor(world: World) {
                    super(world);
                }

                onUpdate(delta: number) {
                    testFn(delta);
                }
            }

            const world = new World();
            world.createNode(TestNode)({});

            expect(testFn).not.toHaveBeenCalled();

            world.start();

            setTimeout(() => {
                expect(testFn).toHaveBeenCalled();
                world.stop();
                done();
            }, 100); // Wait for at least one update cycle
        });

        it('should result in a no-op if already running', () => {
            const world = new World();
            world.start();
            expect(() => world.start()).not.toThrow();
            expect(world.isRunning).toBe(true);
        });
    });

    describe('stop', () => {
        it('should mark the world as not running', () => {
            const world = new World();
            expect(world.isRunning).toBe(false);
            world.start();
            expect(world.isRunning).toBe(true);
            world.stop();
            expect(world.isRunning).toBe(false);
        });

        it('should cancel the update loop', async () => {
            const testFn = jest.fn();

            class TestNode extends DynamicNode {
                constructor(world: World) {
                    super(world);
                }

                onUpdate(delta: number) {
                    testFn(delta);
                }
            }

            const world = new World();
            world.createNode(TestNode)({});

            world.start();
            let numTimesCalledBeforeStop = 0;
            await new Promise<void>((resolve) => {
                setTimeout(() => {
                    world.stop();
                    expect(testFn).toHaveBeenCalled();
                    numTimesCalledBeforeStop = testFn.mock.calls.length;
                    resolve();
                }, 100);
            });
            expect(testFn).toHaveBeenCalledTimes(numTimesCalledBeforeStop);
        });

        it('should result in a no-op if not running', () => {
            const world = new World();
            expect(() => world.stop()).not.toThrow();
            expect(world.isRunning).toBe(false);
        });
    });

    describe('createNode', () => {
        it('should create a new node of the specified type', () => {
            class TestNode extends Node {
                constructor(world: World) {
                    super(world);
                }
            }
            const world = new World();
            const node = world.createNode(TestNode)({});
            expect(node).toBeInstanceOf(TestNode);
        });

        it('should add the created node to the world', () => {
            class TestWorld extends World {
                getNodes() {
                    return this.nodes;
                }
            }

            class TestNode extends Node {
                constructor(world: World) {
                    super(world);
                }

                getWorld() {
                    return this.world;
                }
            }

            const world = new TestWorld();
            const node = world.createNode(TestNode)({});
            expect(node.getWorld()).toBe(world);
            expect(world.getNodes()).toContain(node);
        });

        it('should track dynamic nodes correctly for updates', async () => {
            const testFn = jest.fn();

            class TestNode extends DynamicNode {
                constructor(world: World) {
                    super(world);
                }

                onUpdate(delta: number) {
                    testFn(delta);
                }
            }
            const world = new World();
            const node = world.createNode(TestNode)({});

            expect(node).toBeInstanceOf(TestNode);
            expect(testFn).not.toHaveBeenCalled();

            world.start();
            await new Promise<void>((resolve) => {
                setTimeout(() => {
                    expect(testFn).toHaveBeenCalled();
                    world.stop();
                    resolve();
                }, 100);
            });
        });
    });
});
