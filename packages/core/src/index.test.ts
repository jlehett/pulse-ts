import { Node, DynamicNode, World } from './index';

describe('Exports', () => {
    it('should export Node class', () => {
        expect(Node).toBeDefined();
        expect(Node).toBeInstanceOf(Function);
    });

    it('should export DynamicNode class', () => {
        expect(DynamicNode).toBeDefined();
        expect(DynamicNode).toBeInstanceOf(Function);
    });

    it('should export World class', () => {
        expect(World).toBeDefined();
        expect(World).toBeInstanceOf(Function);
    });
});
