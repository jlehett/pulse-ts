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

    describe('addTags', () => {
        it('should add tags to a node', () => {
            class TestNode extends Node {
                constructor(world: World) {
                    super(world);
                }
            }

            const world = new World();
            const node = world.createNode(TestNode)({});
            world.addTags(node, ['test']);

            expect(world.getNodesByTag('test')).toContain(node);
        });

        it('should result in a no-op if the tag already exists on the node', () => {
            class TestNode extends Node {
                constructor(world: World) {
                    super(world);
                }
            }

            const world = new World();
            const node = world.createNode(TestNode)({});
            world.addTags(node, ['test']);
            expect(world.getNodesByTag('test')).toContain(node);

            world.addTags(node, ['test']);
            expect(world.getNodesByTag('test')).toContain(node);
        });
    });

    describe('removeTags', () => {
        it('should remove tags from a node', () => {
            class TestNode extends Node {
                constructor(world: World) {
                    super(world);
                }
            }

            const world = new World();
            const node = world.createNode(TestNode)({});
            world.addTags(node, ['test']);
            expect(world.getNodesByTag('test')).toContain(node);

            world.removeTags(node, ['test']);
            expect(world.getNodesByTag('test')).not.toContain(node);
        });

        it('should result in a no-op if the tag does not exist on the node', () => {
            class TestNode extends Node {
                constructor(world: World) {
                    super(world);
                }
            }

            const world = new World();
            const node = world.createNode(TestNode)({});
            world.removeTags(node, ['test']);
            expect(world.getNodesByTag('test')).not.toContain(node);
        });
    });

    describe('queryNodes', () => {
        it('should return nodes that match a simple OR query', () => {
            class TestNode extends Node {
                constructor(world: World) {
                    super(world);
                }
            }

            const world = new World();
            const node1 = world.createNode(TestNode)({});
            const node2 = world.createNode(TestNode)({});
            const node3 = world.createNode(TestNode)({});

            world.addTags(node1, ['test1']);
            world.addTags(node2, ['test2']);
            world.addTags(node3, ['test3']);

            const result = world.queryNodes({ tags: ['test1', 'test2'] });
            expect(result.nodes).toEqual([node1, node2]);
            expect(result.count).toBe(2);
            expect(result.executionTime).toBeGreaterThan(0);
        });

        it('should return nodes that match a simple AND query', () => {
            class TestNode extends Node {
                constructor(world: World) {
                    super(world);
                }
            }

            const world = new World();
            const node1 = world.createNode(TestNode)({});
            const node2 = world.createNode(TestNode)({});
            const node3 = world.createNode(TestNode)({});

            world.addTags(node1, ['test1', 'testA']);
            world.addTags(node2, ['test2', 'testA']);
            world.addTags(node3, ['test3', 'testA']);

            const result = world.queryNodes({
                tags: ['test1', 'test2'],
                requireAllTags: true,
            });
            expect(result.nodes).toEqual([]);
            expect(result.count).toBe(0);
            expect(result.executionTime).toBeGreaterThan(0);

            const result2 = world.queryNodes({
                tags: ['test1', 'testA'],
                requireAllTags: true,
            });
            expect(result2.nodes).toEqual([node1]);
            expect(result2.count).toBe(1);
            expect(result2.executionTime).toBeGreaterThan(0);
        });

        it('should return nodes that match a query with excludeTags', () => {
            class TestNode extends Node {
                constructor(world: World) {
                    super(world);
                }
            }

            const world = new World();
            const node1 = world.createNode(TestNode)({});
            const node2 = world.createNode(TestNode)({});
            const node3 = world.createNode(TestNode)({});

            world.addTags(node1, ['test1', 'testA']);
            world.addTags(node2, ['test2', 'testA']);
            world.addTags(node3, ['test3', 'testA']);

            const result = world.queryNodes({
                tags: ['testA'],
                excludeTags: ['test3'],
            });
            expect(result.nodes).toEqual([node1, node2]);
            expect(result.count).toBe(2);
            expect(result.executionTime).toBeGreaterThan(0);
        });

        it('should return all nodes if no query is provided', () => {
            class TestNode extends Node {
                constructor(world: World) {
                    super(world);
                }
            }

            const world = new World();
            const node1 = world.createNode(TestNode)({});
            const node2 = world.createNode(TestNode)({});
            const node3 = world.createNode(TestNode)({});

            world.addTags(node1, ['test1', 'testA']);
            world.addTags(node2, ['test2', 'testA']);
            world.addTags(node3, ['test3', 'testA']);

            const result = world.queryNodes({});
            expect(result.nodes).toEqual([node1, node2, node3]);
            expect(result.count).toBe(3);
            expect(result.executionTime).toBeGreaterThan(0);
        });
    });

    describe('getNodesByTag', () => {
        it('should return nodes that have the specified tag', () => {
            class TestNode extends Node {
                constructor(world: World) {
                    super(world);
                }
            }

            const world = new World();
            const node1 = world.createNode(TestNode)({});
            const node2 = world.createNode(TestNode)({});
            const node3 = world.createNode(TestNode)({});

            world.addTags(node1, ['test1', 'testA']);
            world.addTags(node2, ['test2', 'testA']);
            world.addTags(node3, ['test3', 'testB']);

            const result = world.getNodesByTag('testA');
            expect(result).toEqual([node1, node2]);
        });

        it('should return an empty array if no nodes have the specified tag', () => {
            class TestNode extends Node {
                constructor(world: World) {
                    super(world);
                }
            }

            const world = new World();
            world.createNode(TestNode)({});
            world.createNode(TestNode)({});
            world.createNode(TestNode)({});

            const result = world.getNodesByTag('testA');
            expect(result).toEqual([]);
        });
    });
});
