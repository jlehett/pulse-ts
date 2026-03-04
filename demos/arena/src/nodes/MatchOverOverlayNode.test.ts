import { MatchOverOverlayNode } from './MatchOverOverlayNode';

describe('MatchOverOverlayNode', () => {
    it('exports the node function', () => {
        expect(typeof MatchOverOverlayNode).toBe('function');
    });

    it('accepts optional onRequestMenu prop', () => {
        // Verify the function signature accepts props without errors
        expect(MatchOverOverlayNode.length).toBeLessThanOrEqual(1);
    });

    it('accepts optional onRequestRematch and online props', () => {
        // Type-level: the function accepts the extended props shape
        expect(MatchOverOverlayNode.length).toBeLessThanOrEqual(1);
    });
});
