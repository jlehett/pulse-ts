import { World } from './World';
import { Node } from './Node';

describe('Node', () => {
    describe('get parent', () => {
        it('should return the parent Node if it exists', () => {
            class TestNode extends Node {
                constructor(world: World) {
                    super(world);
                }
            }

            const world = new World();
            const parent = world.createNode(TestNode)({});
            const child = parent.createChild(TestNode)({});
            expect(child.parent).toBe(parent);
        });

        it('should return null if the Node has no parent', () => {
            class TestNode extends Node {
                constructor(world: World) {
                    super(world);
                }
            }

            const world = new World();
            const node = world.createNode(TestNode)({});
            expect(node.parent).toBeNull();
        });
    });

    describe('get children', () => {
        it('should return an empty array if the Node has no children', () => {
            class TestNode extends Node {
                constructor(world: World) {
                    super(world);
                }
            }

            const world = new World();
            const node = world.createNode(TestNode)({});
            expect(node.children).toEqual([]);
        });

        it('should return the children Nodes of this Node', () => {
            class TestNode extends Node {
                constructor(world: World) {
                    super(world);
                }
            }

            const world = new World();
            const parent = world.createNode(TestNode)({});
            const child1 = parent.createChild(TestNode)({});
            const child2 = parent.createChild(TestNode)({});
            expect(parent.children).toEqual([child1, child2]);
        });

        it('should return a shallow copy of the children Nodes', () => {
            class TestNode extends Node {
                constructor(world: World) {
                    super(world);
                }
            }

            const world = new World();
            const parent = world.createNode(TestNode)({});
            const child1 = parent.createChild(TestNode)({});
            const child2 = parent.createChild(TestNode)({});
            expect(parent.children).toEqual([child1, child2]);
            parent.children.push(new TestNode(world));
            expect(parent.children).toEqual([child1, child2]); // Should not modify original children array
        });
    });

    describe('createChild', () => {
        it('should create a new child Node of the specified type', () => {
            class TestNode extends Node {
                constructor(world: World) {
                    super(world);
                }
            }

            const world = new World();
            const parent = world.createNode(TestNode)({});
            const child = parent.createChild(TestNode)({});
            expect(child).toBeInstanceOf(TestNode);
            expect(child.parent).toBe(parent);
            expect(parent.children).toContain(child);
        });

        it('should add the created child Node to the same World as the parent', () => {
            class TestWorld extends World {
                getNodes() {
                    return this.nodes;
                }
            }

            class TestNode extends Node {
                constructor(world: World) {
                    super(world);
                }

                get _world() {
                    return this.world;
                }

                onUpdate() {
                    // No-op for testing
                }
            }

            const world = new TestWorld();
            const parent = world.createNode(TestNode)({});
            const child = parent.createChild(TestNode)({});
            expect(child._world).toBe(world);
            expect(world.getNodes()).toContain(child);
        });
    });

    describe('destroy', () => {
        it('should remove the Node from its parent if it has one', () => {
            class TestNode extends Node {
                constructor(world: World) {
                    super(world);
                }
            }

            const world = new World();
            const parent = world.createNode(TestNode)({});
            const child = parent.createChild(TestNode)({});
            expect(parent.children).toContain(child);
            child.destroy();
            expect(parent.children).not.toContain(child);
        });

        it('should remove the Node from the World it belongs to', () => {
            class TestWorld extends World {
                getNodes() {
                    return this.nodes;
                }
            }

            class TestNode extends Node {
                constructor(world: World) {
                    super(world);
                }

                onUpdate() {
                    // No-op for testing
                }
            }

            const world = new TestWorld();
            const node = world.createNode(TestNode)({});
            expect(world.getNodes()).toContain(node);
            node.destroy();
            expect(world.getNodes()).not.toContain(node);
        });

        it('should destroy all children Nodes recursively', () => {
            class TestWorld extends World {
                getNodes() {
                    return this.nodes;
                }
            }

            class TestNode extends Node {
                constructor(world: World) {
                    super(world);
                }

                onUpdate() {
                    // No-op for testing
                }
            }

            const world = new TestWorld();
            const parent = world.createNode(TestNode)({});
            const child = parent.createChild(TestNode)({});
            const grandChild = child.createChild(TestNode)({});
            expect(world.getNodes()).toContain(parent);
            expect(world.getNodes()).toContain(child);
            expect(world.getNodes()).toContain(grandChild);
            parent.destroy();
            expect(world.getNodes()).not.toContain(parent);
            expect(world.getNodes()).not.toContain(child);
            expect(world.getNodes()).not.toContain(grandChild);
        });

        it('should call the onDestroy lifecycle method before removing the Node', () => {
            const testFn = jest.fn();

            class TestNode extends Node {
                constructor(world: World) {
                    super(world);
                }

                onDestroy() {
                    testFn();
                }
            }

            const world = new World();
            const node = world.createNode(TestNode)({});
            expect(testFn).not.toHaveBeenCalled();
            node.destroy();
            expect(testFn).toHaveBeenCalled();
        });
    });

    describe('onDestroy', () => {
        it('should be called when the Node is destroyed', () => {
            const testFn = jest.fn();

            class TestNode extends Node {
                constructor(world: World) {
                    super(world);
                }

                onDestroy() {
                    testFn();
                }
            }

            const world = new World();
            const node = world.createNode(TestNode)({});
            expect(testFn).not.toHaveBeenCalled();
            node.destroy();
            expect(testFn).toHaveBeenCalled();
        });

        it('should allow access to the Node and its parent-child relationships', () => {
            let foundParent, foundChild;

            class TestNode extends Node {
                constructor(world: World) {
                    super(world);
                }
            }

            class NodeToDestroy extends Node {
                constructor(world: World) {
                    super(world);
                }

                onDestroy() {
                    foundParent = this.parent;
                    // eslint-disable-next-line @typescript-eslint/no-this-alias
                    foundChild = this;
                }
            }

            const world = new World();
            const parent = world.createNode(TestNode)({});
            const child = parent.createChild(NodeToDestroy)({});
            expect(foundParent).not.toBeDefined();
            expect(foundChild).not.toBeDefined();
            child.destroy();
            expect(foundParent).toBe(parent);
            expect(foundChild).toBe(child);
        });
    });

    describe('addTags', () => {
        it('should add tags to the node', () => {
            class TestNode extends Node {
                constructor(world: World) {
                    super(world);
                }
            }

            const world = new World();
            const node = world.createNode(TestNode)({});
            node.addTags(['test']);

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
            node.addTags(['test']);
            expect(world.getNodesByTag('test')).toContain(node);

            node.addTags(['test']);
            expect(world.getNodesByTag('test')).toContain(node);
        });
    });

    describe('removeTags', () => {
        it('should remove tags from the node', () => {
            class TestNode extends Node {
                constructor(world: World) {
                    super(world);
                }
            }

            const world = new World();
            const node = world.createNode(TestNode)({});
            node.addTags(['test']);
            expect(world.getNodesByTag('test')).toContain(node);

            node.removeTags(['test']);
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
            node.removeTags(['test']);
            expect(world.getNodesByTag('test')).not.toContain(node);
        });
    });
});
