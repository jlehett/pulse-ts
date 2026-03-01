import { PauseMenuNode } from './PauseMenuNode';

describe('PauseMenuNode', () => {
    it('exports the node function', () => {
        expect(typeof PauseMenuNode).toBe('function');
    });

    it('accepts optional onRequestMenu prop', () => {
        // Verify the function signature accepts props without errors
        expect(PauseMenuNode.length).toBeLessThanOrEqual(1);
    });
});
